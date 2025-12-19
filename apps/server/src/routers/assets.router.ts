import { errorCodes } from '@shurai/shared';

import { WorkspaceAssetModel } from '@~/db/models/workspace-asset.model';
import { WorkspaceItemModel } from '@~/db/models/workspace-item.model';
import { WorkspaceModel } from '@~/db/models/workspace.model';
import { ORPCNotFoundError, ORPCUnprocessableContentError } from '@~/lib/orpc-error-wrapper';

import { base, protectedProcedure, publicProcedure } from '../lib/orpc';

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

    // Allow access to assets owned by the user OR global assets
    if (!asset || (asset.userId !== userId && !asset.isGlobal)) {
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
      isGlobal: input.isGlobal ?? false,
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

    // Check if asset is referenced by any items
    const itemCount = await WorkspaceItemModel.countDocuments({ assetId });

    // Check if asset is referenced by any workspaces as cover
    const workspaceCount = await WorkspaceModel.countDocuments({ coverAssetId: assetId });

    if (itemCount > 0 || workspaceCount > 0) {
      throw ORPCUnprocessableContentError(errorCodes.ASSET_IN_USE);
    }

    await WorkspaceAssetModel.findByIdAndDelete(assetId);

    return { success: true };
  }),

  listGlobalAssets: publicProcedure.assets.listGlobalAssets.handler(async ({ input }) => {
    const filter: Record<string, unknown> = { isGlobal: true };
    if (input.type) {
      filter.type = input.type;
    }

    const assets = await WorkspaceAssetModel.find(filter).sort({ updatedAt: -1 });

    return assets;
  }),

  generateUploadUrl: protectedProcedure.assets.generateUploadUrl.handler(async ({ input }) => {
    // This is a stub implementation for presigned URL generation
    // In production, this would integrate with AWS S3, Google Cloud Storage, etc.
    const { fileName, assetType } = input;

    // Generate a stub URL structure
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const stubPath = `/uploads/${assetType.toLowerCase()}/${timestamp}-${sanitizedFileName}`;

    // Return stub URLs - in production these would be actual presigned URLs
    return {
      uploadUrl: `https://storage.example.com${stubPath}?upload=true`,
      fileUrl: `https://cdn.example.com${stubPath}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    };
  }),
});
