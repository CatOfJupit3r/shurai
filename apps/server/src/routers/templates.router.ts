import { errorCodes } from '@shurai/shared';

import { WorkspaceTemplateModel } from '@~/db/models/workspace-template.model';
import { ORPCNotFoundError } from '@~/lib/orpc-error-wrapper';
import { templateService } from '@~/services/template.service';

import { base, protectedProcedure } from '../lib/orpc';

export const templatesRouter = base.templates.router({
  listTemplates: protectedProcedure.templates.listTemplates.handler(async ({ context, input }) => {
    const userId = context.session.user.id;

    const filter: Record<string, unknown> = {
      $or: [{ userId }, { scope: 'COMMUNITY' }],
    };

    if (input.scope) {
      if (input.scope === 'PERSONAL') {
        filter.$or = [{ userId, scope: 'PERSONAL' }];
      } else if (input.scope === 'COMMUNITY') {
        filter.$or = [{ scope: 'COMMUNITY' }];
      }
    }

    const templates = await WorkspaceTemplateModel.find(filter).sort({ updatedAt: -1 });

    const templatesWithRootItem = await Promise.all(
      templates.map(async (template) => {
        const rootItem = await templateService.getRootTemplateItem(template._id);
        return {
          _id: template._id,
          userId: template.userId,
          name: template.name,
          description: template.description,
          scope: template.scope,
          rootItem: rootItem ?? { name: '', children: [] },
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        };
      }),
    );

    return templatesWithRootItem;
  }),

  getTemplate: protectedProcedure.templates.getTemplate.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { templateId } = input;

    const template = await WorkspaceTemplateModel.findById(templateId);

    if (!template || (template.scope === 'PERSONAL' && template.userId !== userId)) {
      throw ORPCNotFoundError(errorCodes.TEMPLATE_NOT_FOUND);
    }

    const rootItem = await templateService.getRootTemplateItem(template._id);

    return {
      _id: template._id,
      userId: template.userId,
      name: template.name,
      description: template.description,
      scope: template.scope,
      rootItem: rootItem ?? { name: '', children: [] },
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }),

  createTemplate: protectedProcedure.templates.createTemplate.handler(async ({ context, input }) => {
    const userId = context.session.user.id;

    const rootItemId = await templateService.createTemplateItemsFromStructure('temp', input.rootItem);

    const template = await WorkspaceTemplateModel.create({
      userId,
      name: input.name,
      description: input.description,
      scope: input.scope,
      rootItemId,
    });

    // Update template items with the actual template ID
    await templateService.deleteTemplateItems('temp');
    await templateService.createTemplateItemsFromStructure(template._id, input.rootItem);

    const rootItem = await templateService.getRootTemplateItem(template._id);

    return {
      _id: template._id,
      userId: template.userId,
      name: template.name,
      description: template.description,
      scope: template.scope,
      rootItem: rootItem ?? { name: '', children: [] },
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }),

  updateTemplate: protectedProcedure.templates.updateTemplate.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { templateId, ...updates } = input;

    const template = await WorkspaceTemplateModel.findById(templateId);

    if (!template || template.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.TEMPLATE_NOT_FOUND);
    }

    if (updates.name !== undefined) {
      template.name = updates.name;
    }
    if (updates.description !== undefined) {
      template.description = updates.description;
    }
    if (updates.scope !== undefined) {
      template.scope = updates.scope;
    }
    if (updates.rootItem !== undefined) {
      await templateService.deleteTemplateItems(templateId);
      const rootItemId = await templateService.createTemplateItemsFromStructure(templateId, updates.rootItem);
      template.rootItemId = rootItemId;
    }

    await template.save();

    const rootItem = await templateService.getRootTemplateItem(template._id);

    return {
      _id: template._id,
      userId: template.userId,
      name: template.name,
      description: template.description,
      scope: template.scope,
      rootItem: rootItem ?? { name: '', children: [] },
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }),

  deleteTemplate: protectedProcedure.templates.deleteTemplate.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { templateId } = input;

    const template = await WorkspaceTemplateModel.findById(templateId);

    if (!template || template.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.TEMPLATE_NOT_FOUND);
    }

    await templateService.deleteTemplateItems(templateId);
    await WorkspaceTemplateModel.findByIdAndDelete(templateId);

    return { success: true };
  }),
});
