import { oc } from '@orpc/contract';
import z from 'zod';

import { TemplateScopeSchema } from '../enums/workspace.enums';
import { authProcedure } from './procedures';

const TEMPLATE_ITEM_SCHEMA = z.object({
  name: z.string(),
  description: z.string().optional(),
  assetId: z.string().optional(),
  children: z.lazy(() => z.array(TEMPLATE_ITEM_SCHEMA)).optional(),
});

const TEMPLATE_SCHEMA = z.object({
  _id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  scope: TemplateScopeSchema,
  rootItem: TEMPLATE_ITEM_SCHEMA,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const CREATE_TEMPLATE_INPUT_SCHEMA = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  scope: TemplateScopeSchema,
  rootItem: TEMPLATE_ITEM_SCHEMA,
});

const UPDATE_TEMPLATE_INPUT_SCHEMA = z.object({
  templateId: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  scope: TemplateScopeSchema.optional(),
  rootItem: TEMPLATE_ITEM_SCHEMA.optional(),
});

const listTemplates = authProcedure
  .route({
    path: '/list',
    method: 'GET',
    summary: "List accessible templates",
    description:
      'Returns all templates accessible to the authenticated user. Includes personal templates owned by the user and community templates shared by others. Templates are blueprints that bundle an item with an entire subtree for one-click creation.',
  })
  .input(
    z.object({
      scope: TemplateScopeSchema.optional(),
    }),
  )
  .output(z.array(TEMPLATE_SCHEMA));

const getTemplate = authProcedure
  .route({
    path: '/:templateId',
    method: 'GET',
    summary: 'Get template by ID',
    description:
      'Retrieves a specific template by ID. Returns the template if it is owned by the user or has COMMUNITY scope. Throws TEMPLATE_NOT_FOUND if the template does not exist or is not accessible.',
  })
  .input(
    z.object({
      templateId: z.string(),
    }),
  )
  .output(TEMPLATE_SCHEMA);

const createTemplate = authProcedure
  .route({
    path: '/',
    method: 'POST',
    summary: 'Create a new template',
    description:
      'Creates a new template owned by the authenticated user. Templates are blueprints that define a root item and its entire subtree structure. Scope can be PERSONAL (only visible to creator) or COMMUNITY (visible to all users). Returns the created template object.',
  })
  .input(CREATE_TEMPLATE_INPUT_SCHEMA)
  .output(TEMPLATE_SCHEMA);

const updateTemplate = authProcedure
  .route({
    path: '/:templateId',
    method: 'PUT',
    summary: 'Update an existing template',
    description:
      'Updates an existing template. Only the owner can update their templates. Returns TEMPLATE_NOT_FOUND if the template does not exist or does not belong to the authenticated user.',
  })
  .input(UPDATE_TEMPLATE_INPUT_SCHEMA)
  .output(TEMPLATE_SCHEMA);

const deleteTemplate = authProcedure
  .route({
    path: '/:templateId',
    method: 'DELETE',
    summary: 'Delete a template',
    description:
      'Deletes a template. Only the owner can delete their templates. Returns TEMPLATE_NOT_FOUND if the template does not exist or does not belong to the authenticated user.',
  })
  .input(
    z.object({
      templateId: z.string(),
    }),
  )
  .output(z.object({ success: z.boolean() }));

const WORKSPACE_ITEM_SCHEMA = z.object({
  _id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  acquireDate: z.coerce.date().optional(),
  assetId: z.string().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number(),
  children: z.lazy(() => z.array(WORKSPACE_ITEM_SCHEMA)),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const applyTemplate = authProcedure
  .route({
    path: '/:templateId/apply',
    method: 'POST',
    summary: 'Apply template to workspace',
    description:
      'Applies a template to a workspace by creating the root item plus all descendants in one operation. The user must own the workspace and have access to the template (owned by user or has COMMUNITY scope). Returns the created root item with its full hierarchy. Optionally accepts a parentId to nest the template under an existing item.',
  })
  .input(
    z.object({
      templateId: z.string(),
      workspaceId: z.string(),
      parentId: z.string().optional(),
    }),
  )
  .output(WORKSPACE_ITEM_SCHEMA);

const templatesContract = oc.prefix('/templates').router({
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate,
});

export default templatesContract;
