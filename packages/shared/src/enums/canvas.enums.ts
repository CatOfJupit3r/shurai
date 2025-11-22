import { z } from 'zod';

// Canvas node types - determines what kind of content the node displays
export const CanvasNodeTypeSchema = z.enum(['ITEM', 'ASSET', 'SUB_CANVAS']);
export const CANVAS_NODE_TYPE = CanvasNodeTypeSchema.enum;
export type CanvasNodeType = z.infer<typeof CanvasNodeTypeSchema>;
