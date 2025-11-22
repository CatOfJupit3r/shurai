import type { ActivityAction, ActivityEntityType } from '@shurai/shared/enums/activity.enums';

import { ActivityModel } from '@~/db/models/activity.model';

interface iLogActivityParams {
  userId: string;
  workspaceId?: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
}

class ActivityService {
  async logActivity(params: iLogActivityParams) {
    try {
      await ActivityModel.create({
        userId: params.userId,
        workspaceId: params.workspaceId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName,
        metadata: params.metadata,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  async getActivities(
    userId: string,
    filters: {
      workspaceId?: string;
      entityType?: ActivityEntityType;
      action?: ActivityAction;
      limit?: number;
      offset?: number;
    },
  ) {
    const query: Record<string, unknown> = { userId };

    if (filters.workspaceId) {
      query.workspaceId = filters.workspaceId;
    }
    if (filters.entityType) {
      query.entityType = filters.entityType;
    }
    if (filters.action) {
      query.action = filters.action;
    }

    const activities = await ActivityModel.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit ?? 50)
      .skip(filters.offset ?? 0)
      .lean();

    return activities;
  }

  async getActivityStats(userId: string, workspaceId?: string) {
    const query: Record<string, unknown> = { userId };
    if (workspaceId) {
      query.workspaceId = workspaceId;
    }

    const totalActivities = await ActivityModel.countDocuments(query);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivities = await ActivityModel.countDocuments({
      ...query,
      createdAt: { $gte: sevenDaysAgo },
    });

    const byActionPipeline = await ActivityModel.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } },
    ]);

    const byEntityTypePipeline = await ActivityModel.aggregate([
      { $match: query },
      { $group: { _id: '$entityType', count: { $sum: 1 } } },
    ]);

    const byAction: Record<string, number> = {};
    byActionPipeline.forEach((item) => {
      if (item._id && typeof item._id === 'string') {
        byAction[item._id] = item.count;
      }
    });

    const byEntityType: Record<string, number> = {};
    byEntityTypePipeline.forEach((item) => {
      if (item._id && typeof item._id === 'string') {
        byEntityType[item._id] = item.count;
      }
    });

    return {
      totalActivities,
      recentActivities,
      byAction,
      byEntityType,
    };
  }
}

export const activityService = new ActivityService();
