import { oc } from '@orpc/contract';
import z from 'zod';

import { authProcedure } from './procedures';

const ITEM_SCHEMA = z.object({
  _id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  acquireDate: z.coerce.date().optional(),
  assetId: z.string().optional(),
  parentId: z.string().optional().nullable(),
  order: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const ITEM_WITH_CHILDREN_SCHEMA = z.object({
  _id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  acquireDate: z.coerce.date().optional(),
  assetId: z.string().optional(),
  parentId: z.string().optional().nullable(),
  order: z.number(),
  children: z.lazy(() => z.array(ITEM_WITH_CHILDREN_SCHEMA)),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const CREATE_ITEM_INPUT_SCHEMA = z.object({
  workspaceId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  acquireDate: z.coerce.date().optional(),
  assetId: z.string().optional(),
  parentId: z.string().optional(),
});

const UPDATE_ITEM_INPUT_SCHEMA = z.object({
  itemId: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  acquireDate: z.coerce.date().optional(),
  assetId: z.string().optional(),
  parentId: z.string().optional().nullable(),
});

const MOVE_ITEM_INPUT_SCHEMA = z.object({
  itemId: z.string(),
  newParentId: z.string().optional().nullable(),
});

const CREATE_FROM_TEMPLATE_INPUT_SCHEMA = z.object({
  workspaceId: z.string(),
  templateId: z.string(),
  parentId: z.string().optional(),
});

const REORDER_ITEMS_INPUT_SCHEMA = z.object({
  workspaceId: z.string(),
  parentId: z.string().optional().nullable(),
  itemOrders: z.array(
    z.object({
      itemId: z.string(),
      order: z.number().int().min(0),
    }),
  ),
});

const listItems = authProcedure
  .route({
    path: '/list',
    method: 'GET',
    summary: 'List items in a workspace',
    description:
      'Returns all items in the specified workspace. Items are the atomic building blocks that can represent hardware, peripherals, décor, software, or any user-defined element. Only accessible if the user owns the workspace or the workspace is public.',
  })
  .input(
    z.object({
      workspaceId: z.string(),
    }),
  )
  .output(z.array(ITEM_SCHEMA));

const getItemHierarchy = authProcedure
  .route({
    path: '/hierarchy',
    method: 'GET',
    summary: 'Get item hierarchy tree',
    description:
      'Returns the complete item hierarchy tree for a workspace, with parent-child relationships resolved. Root items (no parent) are at the top level, and children are nested recursively. Only accessible if the user owns the workspace or the workspace is public.',
  })
  .input(
    z.object({
      workspaceId: z.string(),
    }),
  )
  .output(z.array(ITEM_WITH_CHILDREN_SCHEMA));

const getItem = authProcedure
  .route({
    path: '/:itemId',
    method: 'GET',
    summary: 'Get item by ID',
    description:
      'Retrieves a specific item by ID. Returns ITEM_NOT_FOUND if the item does not exist or the user does not have access to the workspace.',
  })
  .input(
    z.object({
      itemId: z.string(),
    }),
  )
  .output(ITEM_SCHEMA);

const createItem = authProcedure
  .route({
    path: '/',
    method: 'POST',
    summary: 'Create a new item',
    description:
      'Creates a new item in the specified workspace. Only the workspace owner can create items. If parentId is provided, validates that the parent exists in the same workspace. Returns the created item object.',
  })
  .input(CREATE_ITEM_INPUT_SCHEMA)
  .output(ITEM_SCHEMA);

const updateItem = authProcedure
  .route({
    path: '/:itemId',
    method: 'PUT',
    summary: 'Update an existing item',
    description:
      'Updates an existing item. Only the workspace owner can update items. If parentId is changed, validates the new parent exists and prevents circular references. Returns ITEM_NOT_FOUND if the item does not exist or user lacks access.',
  })
  .input(UPDATE_ITEM_INPUT_SCHEMA)
  .output(ITEM_SCHEMA);

const moveItem = authProcedure
  .route({
    path: '/:itemId/move',
    method: 'PUT',
    summary: 'Move item to a new parent',
    description:
      'Moves an item to a new parent in the hierarchy. Only the workspace owner can move items. Validates that the new parent exists in the same workspace and prevents circular references. Set newParentId to null to move item to root level.',
  })
  .input(MOVE_ITEM_INPUT_SCHEMA)
  .output(ITEM_SCHEMA);

const deleteItem = authProcedure
  .route({
    path: '/:itemId',
    method: 'DELETE',
    summary: 'Delete an item',
    description:
      'Deletes an item and all its children recursively. Only the workspace owner can delete items. Returns ITEM_NOT_FOUND if the item does not exist or user lacks access.',
  })
  .input(
    z.object({
      itemId: z.string(),
    }),
  )
  .output(z.object({ success: z.boolean() }));

const createFromTemplate = authProcedure
  .route({
    path: '/from-template',
    method: 'POST',
    summary: 'Create items from template',
    description:
      'Creates a complete item hierarchy from a template blueprint. Only the workspace owner can create items. The template root item and all its children are instantiated in the workspace. If parentId is provided, the root becomes a child of that item. Returns the created root item with full hierarchy.',
  })
  .input(CREATE_FROM_TEMPLATE_INPUT_SCHEMA)
  .output(ITEM_WITH_CHILDREN_SCHEMA);

const reorderItems = authProcedure
  .route({
    path: '/reorder',
    method: 'PUT',
    summary: 'Reorder items within a parent',
    description:
      'Reorders sibling items by updating their order field. Only the workspace owner can reorder items. All items must belong to the same workspace and have the same parentId. Returns success status.',
  })
  .input(REORDER_ITEMS_INPUT_SCHEMA)
  .output(z.object({ success: z.boolean() }));

const getPublicItemHierarchy = oc
  .route({
    path: '/public/:slug/hierarchy',
    method: 'GET',
    summary: 'Get public item hierarchy by workspace slug',
    description:
      'Returns the complete item hierarchy tree for a public workspace identified by its slug. This endpoint is publicly accessible and does not require authentication. Returns WORKSPACE_NOT_FOUND if the workspace does not exist or is not public.',
  })
  .input(
    z.object({
      slug: z.string(),
    }),
  )
  .output(z.array(ITEM_WITH_CHILDREN_SCHEMA));

const itemsContract = oc.prefix('/items').router({
  listItems,
  getItemHierarchy,
  getItem,
  createItem,
  updateItem,
  moveItem,
  deleteItem,
  createFromTemplate,
  reorderItems,
  getPublicItemHierarchy,
});

export default itemsContract;
