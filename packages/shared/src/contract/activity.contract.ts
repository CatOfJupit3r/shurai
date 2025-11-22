import { oc } from '@orpc/contract';
import z from 'zod';

import { ActivityActionSchema, ActivityEntityTypeSchema } from '../enums/activity.enums';
import { authProcedure } from './procedures';

const ACTIVITY_SCHEMA = z.object({
  _id: z.string(),
  userId: z.string(),
  workspaceId: z.string().optional(),
  action: ActivityActionSchema,
  entityType: ActivityEntityTypeSchema,
  entityId: z.string(),
  entityName: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const LIST_ACTIVITIES_INPUT_SCHEMA = z.object({
  workspaceId: z.string().optional(),
  entityType: ActivityEntityTypeSchema.optional(),
  action: ActivityActionSchema.optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

const ACTIVITY_STATS_SCHEMA = z.object({
  totalActivities: z.number(),
  recentActivities: z.number(),
  byAction: z.record(z.number()),
  byEntityType: z.record(z.number()),
});

const listActivities = authProcedure
  .route({
    path: '/list',
    method: 'GET',
    summary: 'List activity history',
    description:
      'Returns a paginated list of activities for the authenticated user. Activities can be filtered by workspace, entity type, and action type. Useful for showing activity feeds and audit logs in the UI.',
  })
  .input(LIST_ACTIVITIES_INPUT_SCHEMA)
  .output(z.array(ACTIVITY_SCHEMA));

const getActivityStats = authProcedure
  .route({
    path: '/stats',
    method: 'GET',
    summary: 'Get activity statistics',
    description:
      'Returns aggregated statistics about user activities. Includes total activity count, recent activity count (last 7 days), and breakdowns by action type and entity type. Used for dashboard summary cards.',
  })
  .input(
    z.object({
      workspaceId: z.string().optional(),
    }),
  )
  .output(ACTIVITY_STATS_SCHEMA);

const activityContract = oc.prefix('/activity').router({
  listActivities,
  getActivityStats,
});

export default activityContract;
