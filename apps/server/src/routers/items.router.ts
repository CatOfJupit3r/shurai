import { errorCodes } from '@shurai/shared';

import { WorkspaceItemModel } from '@~/db/models/workspace-item.model';
import { WorkspaceTemplateModel } from '@~/db/models/workspace-template.model';
import { WorkspaceModel } from '@~/db/models/workspace.model';
import { ORPCBadRequestError, ORPCNotFoundError } from '@~/lib/orpc-error-wrapper';
import { itemService } from '@~/services/item.service';
import { templateService } from '@~/services/template.service';

import { base, protectedProcedure } from '../lib/orpc';

export const itemsRouter = base.items.router({
  listItems: protectedProcedure.items.listItems.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { workspaceId } = input;

    const workspace = await WorkspaceModel.findById(workspaceId);

    if (!workspace || (workspace.visibility === 'PRIVATE' && workspace.userId !== userId)) {
      throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
    }

    const items = await WorkspaceItemModel.find({ workspaceId }).sort({ order: 1, createdAt: 1 });

    return items;
  }),

  getItemHierarchy: protectedProcedure.items.getItemHierarchy.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { workspaceId } = input;

    const workspace = await WorkspaceModel.findById(workspaceId);

    if (!workspace || (workspace.visibility === 'PRIVATE' && workspace.userId !== userId)) {
      throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
    }

    const hierarchy = await itemService.buildItemHierarchy(workspaceId);

    return hierarchy;
  }),

  getItem: protectedProcedure.items.getItem.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { itemId } = input;

    const item = await WorkspaceItemModel.findById(itemId);

    if (!item) {
      throw ORPCNotFoundError(errorCodes.ITEM_NOT_FOUND);
    }

    const workspace = await WorkspaceModel.findById(item.workspaceId);

    if (!workspace || (workspace.visibility === 'PRIVATE' && workspace.userId !== userId)) {
      throw ORPCNotFoundError(errorCodes.ITEM_NOT_FOUND);
    }

    return item;
  }),

  createItem: protectedProcedure.items.createItem.handler(async ({ context, input }) => {
    const userId = context.session.user.id;

    const workspace = await WorkspaceModel.findById(input.workspaceId);

    if (!workspace || workspace.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
    }

    if (input.parentId) {
      const parent = await WorkspaceItemModel.findOne({
        _id: input.parentId,
        workspaceId: input.workspaceId,
      });

      if (!parent) {
        throw ORPCNotFoundError(errorCodes.ITEM_PARENT_NOT_FOUND);
      }
    }

    const order = await itemService.getNextOrderForParent(input.workspaceId, input.parentId ?? null);

    const item = await WorkspaceItemModel.create({
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description,
      acquireDate: input.acquireDate,
      assetId: input.assetId,
      parentId: input.parentId ?? null,
      order,
    });

    return item;
  }),

  updateItem: protectedProcedure.items.updateItem.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { itemId, ...updates } = input;

    const item = await WorkspaceItemModel.findById(itemId);

    if (!item) {
      throw ORPCNotFoundError(errorCodes.ITEM_NOT_FOUND);
    }

    const workspace = await WorkspaceModel.findById(item.workspaceId);

    if (!workspace || workspace.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.ITEM_NOT_FOUND);
    }

    if (updates.parentId !== undefined) {
      if (updates.parentId) {
        const parent = await WorkspaceItemModel.findOne({
          _id: updates.parentId,
          workspaceId: item.workspaceId,
        });

        if (!parent) {
          throw ORPCNotFoundError(errorCodes.ITEM_PARENT_NOT_FOUND);
        }

        const hasCircularRef = await itemService.checkCircularReference(itemId, updates.parentId);
        if (hasCircularRef) {
          throw ORPCBadRequestError(errorCodes.ITEM_CIRCULAR_REFERENCE);
        }
      }

      item.parentId = updates.parentId;
    }

    if (updates.name !== undefined) {
      item.name = updates.name;
    }
    if (updates.description !== undefined) {
      item.description = updates.description;
    }
    if (updates.acquireDate !== undefined) {
      item.acquireDate = updates.acquireDate;
    }
    if (updates.assetId !== undefined) {
      item.assetId = updates.assetId;
    }

    await item.save();

    return item;
  }),

  moveItem: protectedProcedure.items.moveItem.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { itemId, newParentId } = input;

    const item = await WorkspaceItemModel.findById(itemId);

    if (!item) {
      throw ORPCNotFoundError(errorCodes.ITEM_NOT_FOUND);
    }

    const workspace = await WorkspaceModel.findById(item.workspaceId);

    if (!workspace || workspace.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.ITEM_NOT_FOUND);
    }

    if (newParentId) {
      const parent = await WorkspaceItemModel.findOne({
        _id: newParentId,
        workspaceId: item.workspaceId,
      });

      if (!parent) {
        throw ORPCNotFoundError(errorCodes.ITEM_PARENT_NOT_FOUND);
      }

      const hasCircularRef = await itemService.checkCircularReference(itemId, newParentId);
      if (hasCircularRef) {
        throw ORPCBadRequestError(errorCodes.ITEM_CIRCULAR_REFERENCE);
      }
    }

    item.parentId = newParentId ?? null;
    await item.save();

    return item;
  }),

  deleteItem: protectedProcedure.items.deleteItem.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { itemId } = input;

    const item = await WorkspaceItemModel.findById(itemId);

    if (!item) {
      throw ORPCNotFoundError(errorCodes.ITEM_NOT_FOUND);
    }

    const workspace = await WorkspaceModel.findById(item.workspaceId);

    if (!workspace || workspace.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.ITEM_NOT_FOUND);
    }

    await itemService.deleteItemWithChildren(itemId);

    return { success: true };
  }),

  createFromTemplate: protectedProcedure.items.createFromTemplate.handler(async ({ context, input }) => {
    const userId = context.session.user.id;

    const workspace = await WorkspaceModel.findById(input.workspaceId);

    if (!workspace || workspace.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
    }

    const template = await WorkspaceTemplateModel.findById(input.templateId);

    if (!template || (template.scope === 'PERSONAL' && template.userId !== userId)) {
      throw ORPCNotFoundError(errorCodes.TEMPLATE_NOT_FOUND);
    }

    if (input.parentId) {
      const parent = await WorkspaceItemModel.findOne({
        _id: input.parentId,
        workspaceId: input.workspaceId,
      });

      if (!parent) {
        throw ORPCNotFoundError(errorCodes.ITEM_PARENT_NOT_FOUND);
      }
    }

    const rootTemplateItem = await templateService.getRootTemplateItem(template._id);

    if (!rootTemplateItem) {
      throw ORPCNotFoundError(errorCodes.TEMPLATE_NOT_FOUND);
    }

    const createdHierarchy = await itemService.instantiateTemplateFromHierarchy(
      input.workspaceId,
      rootTemplateItem,
      input.parentId,
    );

    return createdHierarchy;
  }),

  reorderItems: protectedProcedure.items.reorderItems.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { workspaceId, parentId, itemOrders } = input;

    const workspace = await WorkspaceModel.findById(workspaceId);

    if (!workspace || workspace.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
    }

    const itemIds = itemOrders.map((io) => io.itemId);
    const items = await WorkspaceItemModel.find({
      _id: { $in: itemIds },
      workspaceId,
    });

    if (items.length !== itemIds.length) {
      throw ORPCNotFoundError(errorCodes.ITEM_NOT_FOUND);
    }

    const normalizedParentId = parentId === undefined ? null : parentId;
    const hasMatchingParents = items.every((item) => item.parentId === normalizedParentId);

    if (!hasMatchingParents) {
      throw ORPCBadRequestError(errorCodes.ITEM_PARENT_MISMATCH);
    }

    await itemService.reorderItems(workspaceId, normalizedParentId, itemOrders);

    return { success: true };
  }),
});
