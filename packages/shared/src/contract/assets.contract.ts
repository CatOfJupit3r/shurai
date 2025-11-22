import { oc } from '@orpc/contract';
import z from 'zod';

import { AssetTypeSchema } from '../enums/workspace.enums';
import { authProcedure } from './procedures';

const ASSET_SCHEMA = z.object({
  _id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: AssetTypeSchema,
  iconUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  themeConfig: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      accentColor: z.string().optional(),
    })
    .optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const CREATE_ASSET_INPUT_SCHEMA = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: AssetTypeSchema,
  iconUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  themeConfig: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      accentColor: z.string().optional(),
    })
    .optional(),
});

const UPDATE_ASSET_INPUT_SCHEMA = z.object({
  assetId: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  type: AssetTypeSchema.optional(),
  iconUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  themeConfig: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      accentColor: z.string().optional(),
    })
    .optional(),
});

const listAssets = authProcedure
  .route({
    path: '/list',
    method: 'GET',
    summary: "List authenticated user's assets",
    description:
      'Returns all assets owned by the authenticated user. Assets define iconography, imagery, and styling used by items or workspaces. Supports filtering by asset type (ICON, IMAGE, COVER, THEME_PRESET).',
  })
  .input(
    z.object({
      type: AssetTypeSchema.optional(),
    }),
  )
  .output(z.array(ASSET_SCHEMA));

const getAsset = authProcedure
  .route({
    path: '/:assetId',
    method: 'GET',
    summary: 'Get asset by ID',
    description:
      'Retrieves a specific asset by ID. Returns the asset if it belongs to the authenticated user, otherwise throws ASSET_NOT_FOUND to prevent information disclosure.',
  })
  .input(
    z.object({
      assetId: z.string(),
    }),
  )
  .output(ASSET_SCHEMA);

const createAsset = authProcedure
  .route({
    path: '/',
    method: 'POST',
    summary: 'Create a new asset',
    description:
      'Creates a new asset owned by the authenticated user. Assets catalog icons, images, covers, and theme presets that can be referenced by items and workspaces. Returns the created asset object.',
  })
  .input(CREATE_ASSET_INPUT_SCHEMA)
  .output(ASSET_SCHEMA);

const updateAsset = authProcedure
  .route({
    path: '/:assetId',
    method: 'PUT',
    summary: 'Update an existing asset',
    description:
      'Updates an existing asset. Only the owner can update their assets. Returns ASSET_NOT_FOUND if the asset does not exist or does not belong to the authenticated user.',
  })
  .input(UPDATE_ASSET_INPUT_SCHEMA)
  .output(ASSET_SCHEMA);

const deleteAsset = authProcedure
  .route({
    path: '/:assetId',
    method: 'DELETE',
    summary: 'Delete an asset',
    description:
      'Deletes an asset. Only the owner can delete their assets. Returns ASSET_NOT_FOUND if the asset does not exist or does not belong to the authenticated user. Note: Deleting an asset may affect items and workspaces that reference it.',
  })
  .input(
    z.object({
      assetId: z.string(),
    }),
  )
  .output(z.object({ success: z.boolean() }));

const assetsContract = oc.prefix('/assets').router({
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
});

export default assetsContract;
