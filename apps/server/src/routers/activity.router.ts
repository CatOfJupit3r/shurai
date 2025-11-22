import { activityService } from '@~/services/activity.service';

import { base, protectedProcedure } from '../lib/orpc';

export const activityRouter = base.activity.router({
  listActivities: protectedProcedure.activity.listActivities.handler(async ({ context, input }) => {
    const userId = context.session.user.id;

    const activities = await activityService.getActivities(userId, {
      workspaceId: input.workspaceId,
      entityType: input.entityType,
      action: input.action,
      limit: input.limit,
      offset: input.offset,
    });

    return activities.map((activity) => ({
      _id: activity._id,
      userId: activity.userId,
      workspaceId: activity.workspaceId,
      action: activity.action,
      entityType: activity.entityType,
      entityId: activity.entityId,
      entityName: activity.entityName,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    }));
  }),

  getActivityStats: protectedProcedure.activity.getActivityStats.handler(async ({ context, input }) => {
    const userId = context.session.user.id;

    const stats = await activityService.getActivityStats(userId, input.workspaceId);

    return stats;
  }),
});
