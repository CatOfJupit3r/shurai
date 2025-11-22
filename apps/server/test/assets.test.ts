import { call } from '@orpc/server';
import { it, expect, describe } from 'bun:test';

import { errorCodes } from '@shurai/shared/enums/errors.enums';

import { appRouter } from './helpers/instance';
import { createUser } from './helpers/utilities';

describe('Assets API', () => {
  describe('createAsset', () => {
    it('should create an asset with valid input', async () => {
      const { ctx } = await createUser();

      const asset = await call(
        appRouter.assets.createAsset,
        {
          name: 'RTX 4090 Icon',
          description: 'GPU icon for items',
          type: 'ICON',
          iconUrl: 'https://example.com/rtx4090.png',
        },
        ctx(),
      );

      expect(asset).not.toBeNil();
      expect(asset.name).toBe('RTX 4090 Icon');
      expect(asset.description).toBe('GPU icon for items');
      expect(asset.type).toBe('ICON');
      expect(asset.iconUrl).toBe('https://example.com/rtx4090.png');
      expect(asset.isGlobal).toBe(false);
      expect(asset._id).toBeDefined();
      expect(asset.createdAt).toBeDefined();
    });

    it('should create an asset with theme config', async () => {
      const { ctx } = await createUser();

      const asset = await call(
        appRouter.assets.createAsset,
        {
          name: 'Dark Theme',
          type: 'THEME_PRESET',
          themeConfig: {
            primaryColor: '#1a1a1a',
            secondaryColor: '#2d2d2d',
            accentColor: '#00ff00',
          },
        },
        ctx(),
      );

      expect(asset.name).toBe('Dark Theme');
      expect(asset.type).toBe('THEME_PRESET');
      expect(asset.themeConfig).toBeDefined();
      expect(asset.themeConfig?.primaryColor).toBe('#1a1a1a');
      expect(asset.themeConfig?.secondaryColor).toBe('#2d2d2d');
      expect(asset.themeConfig?.accentColor).toBe('#00ff00');
    });

    it('should create a global asset', async () => {
      const { ctx } = await createUser();

      const asset = await call(
        appRouter.assets.createAsset,
        {
          name: 'Default PC Icon',
          type: 'ICON',
          iconUrl: 'https://example.com/pc.png',
          isGlobal: true,
        },
        ctx(),
      );

      expect(asset.isGlobal).toBe(true);
    });

    it('should fail if name is empty', async () => {
      const { ctx } = await createUser();

      try {
        await call(
          appRouter.assets.createAsset,
          {
            name: '',
            type: 'ICON',
          },
          ctx(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('listAssets', () => {
    it('should list all assets for user', async () => {
      const { ctx } = await createUser();

      await call(appRouter.assets.createAsset, { name: 'Asset 1', type: 'ICON' }, ctx());
      await call(appRouter.assets.createAsset, { name: 'Asset 2', type: 'IMAGE' }, ctx());

      const assets = await call(appRouter.assets.listAssets, {}, ctx());

      expect(assets.length).toBeGreaterThanOrEqual(2);
      expect(assets[0].name).toBeDefined();
    });

    it('should filter assets by type', async () => {
      const { ctx } = await createUser();

      await call(appRouter.assets.createAsset, { name: 'Icon Asset', type: 'ICON' }, ctx());
      await call(appRouter.assets.createAsset, { name: 'Image Asset', type: 'IMAGE' }, ctx());

      const icons = await call(appRouter.assets.listAssets, { type: 'ICON' }, ctx());
      const images = await call(appRouter.assets.listAssets, { type: 'IMAGE' }, ctx());

      expect(icons.every((asset) => asset.type === 'ICON')).toBe(true);
      expect(images.every((asset) => asset.type === 'IMAGE')).toBe(true);
    });

    it('should only list assets owned by user', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      await call(appRouter.assets.createAsset, { name: 'User 1 Asset', type: 'ICON' }, ctx1());
      await call(appRouter.assets.createAsset, { name: 'User 2 Asset', type: 'ICON' }, ctx2());

      const user1Assets = await call(appRouter.assets.listAssets, {}, ctx1());
      const user2Assets = await call(appRouter.assets.listAssets, {}, ctx2());

      expect(user1Assets.every((asset) => asset.name.includes('User 1'))).toBe(true);
      expect(user2Assets.every((asset) => asset.name.includes('User 2'))).toBe(true);
    });

    it('should return empty array for user with no assets', async () => {
      const { ctx } = await createUser();

      const assets = await call(appRouter.assets.listAssets, {}, ctx());

      expect(assets).toBeArray();
      expect(assets.length).toBe(0);
    });
  });

  describe('getAsset', () => {
    it('should get asset by ID for owner', async () => {
      const { ctx } = await createUser();

      const created = await call(appRouter.assets.createAsset, { name: 'Test Asset', type: 'ICON' }, ctx());

      const asset = await call(appRouter.assets.getAsset, { assetId: created._id }, ctx());

      expect(asset._id).toBe(created._id);
      expect(asset.name).toBe('Test Asset');
    });

    it('should fail to get asset of another user', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const asset = await call(appRouter.assets.createAsset, { name: 'Private Asset', type: 'ICON' }, ctx1());

      try {
        await call(appRouter.assets.getAsset, { assetId: asset._id }, ctx2());
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should fail for non-existent asset', async () => {
      const { ctx } = await createUser();

      try {
        await call(appRouter.assets.getAsset, { assetId: 'nonexistent' }, ctx());
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('updateAsset', () => {
    it('should update asset properties', async () => {
      const { ctx } = await createUser();

      const asset = await call(
        appRouter.assets.createAsset,
        {
          name: 'Original Name',
          description: 'Original Description',
          type: 'ICON',
        },
        ctx(),
      );

      const updated = await call(
        appRouter.assets.updateAsset,
        {
          assetId: asset._id,
          name: 'Updated Name',
          description: 'Updated Description',
        },
        ctx(),
      );

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated Description');
      expect(updated.type).toBe('ICON');
    });

    it('should update theme config', async () => {
      const { ctx } = await createUser();

      const asset = await call(
        appRouter.assets.createAsset,
        {
          name: 'Theme',
          type: 'THEME_PRESET',
          themeConfig: {
            primaryColor: '#000000',
          },
        },
        ctx(),
      );

      const updated = await call(
        appRouter.assets.updateAsset,
        {
          assetId: asset._id,
          themeConfig: {
            primaryColor: '#ffffff',
            accentColor: '#ff0000',
          },
        },
        ctx(),
      );

      expect(updated.themeConfig?.primaryColor).toBe('#ffffff');
      expect(updated.themeConfig?.accentColor).toBe('#ff0000');
    });

    it('should not allow updating another users asset', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const asset = await call(appRouter.assets.createAsset, { name: 'User 1 Asset', type: 'ICON' }, ctx1());

      try {
        await call(
          appRouter.assets.updateAsset,
          {
            assetId: asset._id,
            name: 'Hacked Name',
          },
          ctx2(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('deleteAsset', () => {
    it('should delete asset successfully', async () => {
      const { ctx } = await createUser();

      const asset = await call(appRouter.assets.createAsset, { name: 'To Delete', type: 'ICON' }, ctx());

      const result = await call(appRouter.assets.deleteAsset, { assetId: asset._id }, ctx());

      expect(result.success).toBe(true);

      try {
        await call(appRouter.assets.getAsset, { assetId: asset._id }, ctx());
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should prevent deletion of asset referenced by item', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test Workspace', visibility: 'PRIVATE' },
        ctx(),
      );

      const asset = await call(appRouter.assets.createAsset, { name: 'Used Asset', type: 'ICON' }, ctx());

      await call(
        appRouter.items.createItem,
        {
          workspaceId: workspace._id,
          name: 'GPU',
          assetId: asset._id,
        },
        ctx(),
      );

      try {
        await call(appRouter.assets.deleteAsset, { assetId: asset._id }, ctx());
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should prevent deletion of asset used as workspace cover', async () => {
      const { ctx } = await createUser();

      const asset = await call(appRouter.assets.createAsset, { name: 'Cover Asset', type: 'COVER' }, ctx());

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
          coverAssetId: asset._id,
        },
        ctx(),
      );

      try {
        await call(appRouter.assets.deleteAsset, { assetId: asset._id }, ctx());
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should not allow deleting another users asset', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const asset = await call(appRouter.assets.createAsset, { name: 'User 1 Asset', type: 'ICON' }, ctx1());

      try {
        await call(appRouter.assets.deleteAsset, { assetId: asset._id }, ctx2());
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('listGlobalAssets', () => {
    it('should list all global assets without authentication', async () => {
      const { ctx } = await createUser();

      await call(appRouter.assets.createAsset, { name: 'Global Icon 1', type: 'ICON', isGlobal: true }, ctx());
      await call(appRouter.assets.createAsset, { name: 'Private Icon', type: 'ICON', isGlobal: false }, ctx());
      await call(appRouter.assets.createAsset, { name: 'Global Icon 2', type: 'ICON', isGlobal: true }, ctx());

      const globalAssets = await call(appRouter.assets.listGlobalAssets, {}, { context: { session: null } });

      expect(globalAssets.length).toBeGreaterThanOrEqual(2);
      expect(globalAssets.every((asset) => asset.isGlobal)).toBe(true);
      expect(globalAssets.some((asset) => asset.name === 'Private Icon')).toBe(false);
    });

    it('should filter global assets by type', async () => {
      const { ctx } = await createUser();

      await call(appRouter.assets.createAsset, { name: 'Global Icon', type: 'ICON', isGlobal: true }, ctx());
      await call(appRouter.assets.createAsset, { name: 'Global Image', type: 'IMAGE', isGlobal: true }, ctx());

      const icons = await call(appRouter.assets.listGlobalAssets, { type: 'ICON' }, { context: { session: null } });
      const images = await call(appRouter.assets.listGlobalAssets, { type: 'IMAGE' }, { context: { session: null } });

      expect(icons.every((asset) => asset.type === 'ICON' && asset.isGlobal)).toBe(true);
      expect(images.every((asset) => asset.type === 'IMAGE' && asset.isGlobal)).toBe(true);
    });
  });

  describe('generateUploadUrl', () => {
    it('should generate upload URL for asset', async () => {
      const { ctx } = await createUser();

      const result = await call(
        appRouter.assets.generateUploadUrl,
        {
          fileName: 'gpu-icon.png',
          fileType: 'image/png',
          assetType: 'ICON',
        },
        ctx(),
      );

      expect(result.uploadUrl).toBeDefined();
      expect(result.fileUrl).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      expect(result.uploadUrl).toContain('gpu-icon.png');
      expect(result.fileUrl).toContain('icon');
    });

    it('should sanitize file names', async () => {
      const { ctx } = await createUser();

      const result = await call(
        appRouter.assets.generateUploadUrl,
        {
          fileName: 'my file with spaces & special#chars.png',
          fileType: 'image/png',
          assetType: 'IMAGE',
        },
        ctx(),
      );

      expect(result.uploadUrl).not.toContain(' ');
      expect(result.uploadUrl).not.toContain('#');
      expect(result.uploadUrl).not.toContain('&');
    });

    it('should include asset type in path', async () => {
      const { ctx } = await createUser();

      const iconResult = await call(
        appRouter.assets.generateUploadUrl,
        {
          fileName: 'icon.png',
          fileType: 'image/png',
          assetType: 'ICON',
        },
        ctx(),
      );

      const coverResult = await call(
        appRouter.assets.generateUploadUrl,
        {
          fileName: 'cover.jpg',
          fileType: 'image/jpeg',
          assetType: 'COVER',
        },
        ctx(),
      );

      expect(iconResult.fileUrl).toContain('/icon/');
      expect(coverResult.fileUrl).toContain('/cover/');
    });
  });

  describe('Asset validation', () => {
    it('should validate URL format for iconUrl', async () => {
      const { ctx } = await createUser();

      try {
        await call(
          appRouter.assets.createAsset,
          {
            name: 'Invalid URL Asset',
            type: 'ICON',
            iconUrl: 'not-a-valid-url',
          },
          ctx(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should validate URL format for imageUrl', async () => {
      const { ctx } = await createUser();

      try {
        await call(
          appRouter.assets.createAsset,
          {
            name: 'Invalid URL Asset',
            type: 'IMAGE',
            imageUrl: 'invalid',
          },
          ctx(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should enforce name max length', async () => {
      const { ctx } = await createUser();

      const longName = 'a'.repeat(101);

      try {
        await call(
          appRouter.assets.createAsset,
          {
            name: longName,
            type: 'ICON',
          },
          ctx(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should enforce description max length', async () => {
      const { ctx } = await createUser();

      const longDescription = 'a'.repeat(501);

      try {
        await call(
          appRouter.assets.createAsset,
          {
            name: 'Test',
            type: 'ICON',
            description: longDescription,
          },
          ctx(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });
});
