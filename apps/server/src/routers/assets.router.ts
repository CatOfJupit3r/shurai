import { errorCodes } from '@shurai/shared';

import { WorkspaceAssetModel } from '@~/db/models/workspace-asset.model';
import { ORPCNotFoundError } from '@~/lib/orpc-error-wrapper';

import { base, protectedProcedure } from '../lib/orpc';

export const assetsRouter = base.assets.router({
  listAssets: protectedProcedure.assets.listAssets.handler(async ({ context, input }) => {
    const userId = context.session.user.id;

    const filter: Record<string, unknown> = { userId };
    if (input.type) {
      filter.type = input.type;
    }

    const assets = await WorkspaceAssetModel.find(filter).sort({ updatedAt: -1 });

    return assets;
  }),

  getAsset: protectedProcedure.assets.getAsset.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { assetId } = input;

    const asset = await WorkspaceAssetModel.findById(assetId);

    if (!asset || asset.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.ASSET_NOT_FOUND);
    }

    return asset;
  }),

  createAsset: protectedProcedure.assets.createAsset.handler(async ({ context, input }) => {
    const userId = context.session.user.id;

    const asset = await WorkspaceAssetModel.create({
      userId,
      name: input.name,
      description: input.description,
      type: input.type,
      iconUrl: input.iconUrl,
      imageUrl: input.imageUrl,
      themeConfig: input.themeConfig,
    });

    return asset;
  }),

  updateAsset: protectedProcedure.assets.updateAsset.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { assetId, ...updates } = input;

    const asset = await WorkspaceAssetModel.findById(assetId);

    if (!asset || asset.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.ASSET_NOT_FOUND);
    }

    if (updates.name !== undefined) {
      asset.name = updates.name;
    }
    if (updates.description !== undefined) {
      asset.description = updates.description;
    }
    if (updates.type !== undefined) {
      asset.type = updates.type;
    }
    if (updates.iconUrl !== undefined) {
      asset.iconUrl = updates.iconUrl;
    }
    if (updates.imageUrl !== undefined) {
      asset.imageUrl = updates.imageUrl;
    }
    if (updates.themeConfig !== undefined) {
      asset.themeConfig = updates.themeConfig;
    }

    await asset.save();

    return asset;
  }),

  deleteAsset: protectedProcedure.assets.deleteAsset.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { assetId } = input;

    const asset = await WorkspaceAssetModel.findById(assetId);

    if (!asset || asset.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.ASSET_NOT_FOUND);
    }

    await WorkspaceAssetModel.findByIdAndDelete(assetId);

    return { success: true };
  }),
});
