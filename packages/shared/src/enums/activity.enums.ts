import { z } from 'zod';

// Activity action types
export const ActivityActionSchema = z.enum(['CREATE', 'UPDATE', 'DELETE']);
export const ACTIVITY_ACTION = ActivityActionSchema.enum;
export type ActivityAction = z.infer<typeof ActivityActionSchema>;

// Entity types that can have activity logged
export const ActivityEntityTypeSchema = z.enum(['WORKSPACE', 'ITEM', 'TEMPLATE', 'ASSET']);
export const ACTIVITY_ENTITY_TYPE = ActivityEntityTypeSchema.enum;
export type ActivityEntityType = z.infer<typeof ActivityEntityTypeSchema>;
