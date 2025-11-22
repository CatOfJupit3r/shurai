import { errorCodes } from '@shurai/shared';

import { WorkspaceTemplateModel } from '@~/db/models/workspace-template.model';
import { ORPCNotFoundError } from '@~/lib/orpc-error-wrapper';

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

    return templates;
  }),

  getTemplate: protectedProcedure.templates.getTemplate.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { templateId } = input;

    const template = await WorkspaceTemplateModel.findById(templateId);

    if (!template || (template.scope === 'PERSONAL' && template.userId !== userId)) {
      throw ORPCNotFoundError(errorCodes.TEMPLATE_NOT_FOUND);
    }

    return template;
  }),

  createTemplate: protectedProcedure.templates.createTemplate.handler(async ({ context, input }) => {
    const userId = context.session.user.id;

    const template = await WorkspaceTemplateModel.create({
      userId,
      name: input.name,
      description: input.description,
      scope: input.scope,
      rootItem: input.rootItem,
    });

    return template;
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
      template.rootItem = updates.rootItem;
    }

    await template.save();

    return template;
  }),

  deleteTemplate: protectedProcedure.templates.deleteTemplate.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { templateId } = input;

    const template = await WorkspaceTemplateModel.findById(templateId);

    if (!template || template.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.TEMPLATE_NOT_FOUND);
    }

    await WorkspaceTemplateModel.findByIdAndDelete(templateId);

    return { success: true };
  }),
});
