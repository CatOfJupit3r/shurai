import { oc } from '@orpc/contract';
import z from 'zod';

import { WorkspaceVisibilitySchema } from '../enums/workspace.enums';
import { authProcedure } from './procedures';

const WORKSPACE_SCHEMA = z.object({
  _id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  coverAssetId: z.string().optional(),
  visibility: WorkspaceVisibilitySchema,
  shareableSlug: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const WORKSPACE_WITH_STATS_SCHEMA = WORKSPACE_SCHEMA.extend({
  itemCount: z.number(),
  assetCount: z.number(),
});

const CREATE_WORKSPACE_INPUT_SCHEMA = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  coverAssetId: z.string().optional(),
  visibility: WorkspaceVisibilitySchema.default('PRIVATE'),
});

const UPDATE_WORKSPACE_INPUT_SCHEMA = z.object({
  workspaceId: z.string(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  coverAssetId: z.string().optional().nullable(),
  visibility: WorkspaceVisibilitySchema.optional(),
});

const listWorkspaces = authProcedure
  .route({
    path: '/list',
    method: 'GET',
    summary: "List authenticated user's workspaces",
    description:
      'Returns all workspaces owned by the authenticated user. Workspaces are user-owned collections of items representing full PC environments. Includes quick stats like item count and asset count for dashboard display.',
  })
  .output(z.array(WORKSPACE_WITH_STATS_SCHEMA));

const getWorkspace = authProcedure
  .route({
    path: '/:workspaceId',
    method: 'GET',
    summary: 'Get workspace by ID',
    description:
      'Retrieves a specific workspace by ID. Returns the workspace if it belongs to the authenticated user or is public. Throws WORKSPACE_NOT_FOUND if the workspace does not exist or is private and not owned by the user.',
  })
  .input(
    z.object({
      workspaceId: z.string(),
    }),
  )
  .output(WORKSPACE_SCHEMA);

const getWorkspaceBySlug = oc
  .route({
    path: '/public/:slug',
    method: 'GET',
    summary: 'Get public workspace by shareable slug',
    description:
      'Retrieves a public workspace by its shareable slug. This endpoint is publicly accessible and does not require authentication. Returns WORKSPACE_NOT_FOUND if the workspace does not exist or is not public.',
  })
  .input(
    z.object({
      slug: z.string(),
    }),
  )
  .output(WORKSPACE_SCHEMA);

const createWorkspace = authProcedure
  .route({
    path: '/',
    method: 'POST',
    summary: 'Create a new workspace',
    description:
      'Creates a new workspace owned by the authenticated user. A workspace is a container for items that represent a PC environment. Visibility can be PUBLIC (shareable via link) or PRIVATE (owner only). Returns the created workspace object.',
  })
  .input(CREATE_WORKSPACE_INPUT_SCHEMA)
  .output(WORKSPACE_SCHEMA);

const updateWorkspace = authProcedure
  .route({
    path: '/:workspaceId',
    method: 'PUT',
    summary: 'Update an existing workspace',
    description:
      'Updates an existing workspace. Only the owner can update their workspaces. Changing visibility to PUBLIC automatically generates a shareable slug if one does not exist. Returns WORKSPACE_NOT_FOUND if the workspace does not exist or does not belong to the user.',
  })
  .input(UPDATE_WORKSPACE_INPUT_SCHEMA)
  .output(WORKSPACE_SCHEMA);

const deleteWorkspace = authProcedure
  .route({
    path: '/:workspaceId',
    method: 'DELETE',
    summary: 'Delete a workspace',
    description:
      'Deletes a workspace and all its items. Only the owner can delete their workspaces. Returns WORKSPACE_NOT_FOUND if the workspace does not exist or does not belong to the user.',
  })
  .input(
    z.object({
      workspaceId: z.string(),
    }),
  )
  .output(z.object({ success: z.boolean() }));

const regenerateSlug = authProcedure
  .route({
    path: '/:workspaceId/regenerate-slug',
    method: 'POST',
    summary: 'Regenerate workspace shareable slug',
    description:
      'Generates a new unique shareable slug for the workspace. Only available for PUBLIC workspaces. The old slug will no longer be valid. Only the owner can regenerate slugs. Returns the updated workspace with the new slug.',
  })
  .input(
    z.object({
      workspaceId: z.string(),
    }),
  )
  .output(WORKSPACE_SCHEMA);

const workspacesContract = oc.prefix('/workspaces').router({
  listWorkspaces,
  getWorkspace,
  getWorkspaceBySlug,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  regenerateSlug,
});

export default workspacesContract;
