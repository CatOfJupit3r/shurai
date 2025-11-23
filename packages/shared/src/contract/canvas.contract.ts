import { oc } from '@orpc/contract';
import z from 'zod';

import { CanvasNodeTypeSchema } from '../enums/canvas.enums';
import { authProcedure } from './procedures';

/**
 * Canvas node represents a positioned element in the canvas layout.
 * Can reference an item, asset, or another canvas (sub-canvas).
 * 
 * **Depth Limitation:** Sub-canvases are limited to a maximum depth of 1.
 * This means a canvas node can contain a sub-canvas, but that sub-canvas
 * cannot contain another sub-canvas. This prevents deeply nested structures
 * and maintains performance.
 */
const CANVAS_NODE_SCHEMA = z.object({
  id: z.string(),
  type: CanvasNodeTypeSchema,
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  size: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  // Reference to item, asset, or sub-canvas depending on type
  itemId: z.string().optional(),
  assetId: z.string().optional(),
  subCanvasId: z.string().optional(),
  // Optional display configuration
  zIndex: z.number().int().optional(),
  rotation: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  // Asset hints for client hydration
  assetHints: z
    .object({
      aspectRatio: z.number().positive().optional(),
      dominantColor: z.string().optional(),
    })
    .optional(),
});

/**
 * Content canvas represents a nested canvas that can be embedded in a parent canvas.
 * Limited to depth of 1 - content canvases cannot contain other content canvases.
 */
const CONTENT_CANVAS_SCHEMA = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(CANVAS_NODE_SCHEMA),
  backgroundColor: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Canvas layout represents the complete layout structure for a workspace.
 * Contains nodes and optional sub-canvases with revision tracking.
 */
const CANVAS_LAYOUT_SCHEMA = z.object({
  _id: z.string(),
  workspaceId: z.string(),
  nodes: z.array(CANVAS_NODE_SCHEMA),
  // Embedded content canvases (max depth 1)
  contentCanvases: z.array(CONTENT_CANVAS_SCHEMA).optional(),
  // Canvas configuration
  canvasSize: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  backgroundColor: z.string().optional(),
  gridEnabled: z.boolean().optional(),
  gridSize: z.number().positive().optional(),
  // Revision metadata for tracking changes
  revision: z.number().int().nonnegative(),
  lastModifiedBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const SAVE_LAYOUT_INPUT_SCHEMA = z.object({
  workspaceId: z.string(),
  nodes: z.array(CANVAS_NODE_SCHEMA),
  contentCanvases: z.array(CONTENT_CANVAS_SCHEMA).optional(),
  canvasSize: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  backgroundColor: z.string().optional(),
  gridEnabled: z.boolean().optional(),
  gridSize: z.number().positive().optional(),
});

const getLayout = authProcedure
  .route({
    path: '/:workspaceId/layout',
    method: 'GET',
    summary: 'Get canvas layout for workspace',
    description:
      'Retrieves the canvas layout for the specified workspace. Returns the complete layout structure including nodes, content canvases, and revision metadata. Only accessible if the user owns the workspace or the workspace is public. Returns CANVAS_LAYOUT_NOT_FOUND if no layout exists for this workspace.',
  })
  .input(
    z.object({
      workspaceId: z.string(),
    }),
  )
  .output(CANVAS_LAYOUT_SCHEMA);

const saveLayout = authProcedure
  .route({
    path: '/:workspaceId/layout',
    method: 'PUT',
    summary: 'Save canvas layout for workspace',
    description:
      'Saves or updates the canvas layout for a workspace. Only the workspace owner can save layouts. Automatically increments the revision number and validates depth limitations (max sub-canvas depth of 1). Returns the updated layout with new revision metadata. Returns WORKSPACE_NOT_FOUND if the workspace does not exist or user lacks access.',
  })
  .input(SAVE_LAYOUT_INPUT_SCHEMA)
  .output(CANVAS_LAYOUT_SCHEMA);

const resetLayout = authProcedure
  .route({
    path: '/:workspaceId/layout',
    method: 'DELETE',
    summary: 'Reset canvas layout to default',
    description:
      'Resets the canvas layout to a default empty state. Only the workspace owner can reset layouts. This action cannot be undone. Returns success status. Returns WORKSPACE_NOT_FOUND if the workspace does not exist or user lacks access.',
  })
  .input(
    z.object({
      workspaceId: z.string(),
    }),
  )
  .output(z.object({ success: z.boolean() }));

const getPublicLayout = oc
  .route({
    path: '/public/:slug/layout',
    method: 'GET',
    summary: 'Get public canvas layout by workspace slug',
    description:
      'Retrieves the canvas layout for a public workspace identified by its slug. This endpoint is publicly accessible and does not require authentication. Returns WORKSPACE_NOT_FOUND if the workspace does not exist or is not public.',
  })
  .input(
    z.object({
      slug: z.string(),
    }),
  )
  .output(CANVAS_LAYOUT_SCHEMA);

const getContentCanvas = authProcedure
  .route({
    path: '/content-canvas/:contentCanvasId',
    method: 'GET',
    summary: 'Get content canvas by ID',
    description:
      'Retrieves a specific content canvas (sub-canvas) by its ID. Only accessible if the user owns the parent workspace or the workspace is public. Content canvases are limited to a maximum depth of 1 and represent nested layouts within workspace items. Returns CANVAS_LAYOUT_NOT_FOUND if the content canvas does not exist or user lacks access.',
  })
  .input(
    z.object({
      contentCanvasId: z.string(),
    }),
  )
  .output(CONTENT_CANVAS_SCHEMA);

const canvasContract = oc.prefix('/canvas').router({
  getLayout,
  saveLayout,
  resetLayout,
  getPublicLayout,
  getContentCanvas,
});

export default canvasContract;
