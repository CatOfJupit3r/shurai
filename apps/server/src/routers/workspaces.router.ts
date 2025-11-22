import { errorCodes } from '@shurai/shared';

import { WorkspaceItemModel } from '@~/db/models/workspace-item.model';
import { WorkspaceModel } from '@~/db/models/workspace.model';
import { ORPCBadRequestError, ORPCInternalServerError, ORPCNotFoundError } from '@~/lib/orpc-error-wrapper';
import { activityService } from '@~/services/activity.service';
import { workspaceService } from '@~/services/workspace.service';

import { base, protectedProcedure, publicProcedure } from '../lib/orpc';

export const workspacesRouter = base.workspaces.router({
  listWorkspaces: protectedProcedure.workspaces.listWorkspaces.handler(async ({ context }) => {
    const userId = context.session.user.id;

    const workspaces = await WorkspaceModel.find({ userId }).sort({ updatedAt: -1 });

    const workspacesWithStats = await Promise.all(
      workspaces.map(async (workspace) => {
        const itemCount = await WorkspaceItemModel.countDocuments({ workspaceId: workspace._id });

        return {
          _id: workspace._id,
          userId: workspace.userId,
          title: workspace.title,
          description: workspace.description,
          coverAssetId: workspace.coverAssetId,
          visibility: workspace.visibility,
          shareableSlug: workspace.shareableSlug,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
          itemCount,
          assetCount: 0,
        };
      }),
    );

    return workspacesWithStats;
  }),

  getWorkspace: protectedProcedure.workspaces.getWorkspace.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { workspaceId } = input;

    const workspace = await WorkspaceModel.findById(workspaceId);

    if (!workspace || (workspace.visibility === 'PRIVATE' && workspace.userId !== userId)) {
      throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
    }

    return workspace;
  }),

  getWorkspaceBySlug: publicProcedure.workspaces.getWorkspaceBySlug.handler(async ({ input }) => {
    const { slug } = input;

    const workspace = await WorkspaceModel.findOne({
      shareableSlug: slug,
      visibility: 'PUBLIC',
    });

    if (!workspace) {
      throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
    }

    return workspace;
  }),

  createWorkspace: protectedProcedure.workspaces.createWorkspace.handler(async ({ context, input }) => {
    const userId = context.session.user.id;

    if (!input.title || input.title.trim() === '') {
      throw ORPCBadRequestError(errorCodes.WORKSPACE_TITLE_REQUIRED);
    }

    let shareableSlug: string | undefined;
    if (input.visibility === 'PUBLIC') {
      try {
        shareableSlug = await workspaceService.generateUniqueSlug();
      } catch {
        throw ORPCInternalServerError();
      }
    }

    const workspace = await WorkspaceModel.create({
      userId,
      title: input.title,
      description: input.description,
      coverAssetId: input.coverAssetId,
      visibility: input.visibility ?? 'PRIVATE',
      shareableSlug,
    });

    await activityService.logActivity({
      userId,
      workspaceId: workspace._id,
      action: 'CREATE',
      entityType: 'WORKSPACE',
      entityId: workspace._id,
      entityName: workspace.title,
    });

    return workspace;
  }),

  updateWorkspace: protectedProcedure.workspaces.updateWorkspace.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { workspaceId, ...updates } = input;

    const workspace = await WorkspaceModel.findById(workspaceId);

    if (!workspace || workspace.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
    }

    if (updates.title !== undefined) {
      workspace.title = updates.title;
    }
    if (updates.description !== undefined) {
      workspace.description = updates.description;
    }
    if (updates.coverAssetId !== undefined) {
      workspace.coverAssetId = updates.coverAssetId ?? undefined;
    }
    if (updates.visibility !== undefined) {
      workspace.visibility = updates.visibility;

      if (updates.visibility === 'PUBLIC' && !workspace.shareableSlug) {
        try {
          workspace.shareableSlug = await workspaceService.generateUniqueSlug();
        } catch {
          throw ORPCInternalServerError();
        }
      }
    }

    await workspace.save();

    await activityService.logActivity({
      userId,
      workspaceId: workspace._id,
      action: 'UPDATE',
      entityType: 'WORKSPACE',
      entityId: workspace._id,
      entityName: workspace.title,
      metadata: updates,
    });

    return workspace;
  }),

  deleteWorkspace: protectedProcedure.workspaces.deleteWorkspace.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { workspaceId } = input;

    const workspace = await WorkspaceModel.findById(workspaceId);

    if (!workspace || workspace.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
    }

    await activityService.logActivity({
      userId,
      workspaceId: workspace._id,
      action: 'DELETE',
      entityType: 'WORKSPACE',
      entityId: workspace._id,
      entityName: workspace.title,
    });

    await workspaceService.deleteWorkspaceWithItems(workspaceId);

    return { success: true };
  }),

  regenerateSlug: protectedProcedure.workspaces.regenerateSlug.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { workspaceId } = input;

    const workspace = await WorkspaceModel.findById(workspaceId);

    if (!workspace || workspace.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
    }

    if (workspace.visibility !== 'PUBLIC') {
      throw ORPCBadRequestError(errorCodes.INVALID_WORKSPACE_VISIBILITY);
    }

    try {
      workspace.shareableSlug = await workspaceService.generateUniqueSlug();
      await workspace.save();
    } catch {
      throw ORPCInternalServerError();
    }

    return workspace;
  }),
});
