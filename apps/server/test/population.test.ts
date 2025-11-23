import { describe, it, expect, beforeEach } from 'bun:test';

import { User } from '@~/db/models/auth.model';
import { UserProfileModel } from '@~/db/models/user-profile.model';
import { WorkspaceAssetModel } from '@~/db/models/workspace-asset.model';
import { WorkspaceItemModel } from '@~/db/models/workspace-item.model';
import { WorkspaceModel } from '@~/db/models/workspace.model';
import populationService from '@~/services/population.service';

import './helpers/setup';

describe('Population Service', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await User.deleteMany({});
    await UserProfileModel.deleteMany({});
    await WorkspaceAssetModel.deleteMany({});
    await WorkspaceItemModel.deleteMany({});
    await WorkspaceModel.deleteMany({});
  });

  describe('populateGlobalAssets', () => {
    it('should create global assets when none exist', async () => {
      const systemUser = await User.create({
        _id: 'test-system',
        name: 'System',
        email: 'system@test.local',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await populationService.populateGlobalAssets(systemUser._id);

      const globalAssets = await WorkspaceAssetModel.find({ isGlobal: true });
      expect(globalAssets.length).toBeGreaterThan(0);

      // Verify all assets are marked as global
      for (const asset of globalAssets) {
        expect(asset.isGlobal).toBe(true);
        expect(asset.userId).toBe(systemUser._id);
        expect(asset.name).toBeDefined();
        expect(asset.type).toBeDefined();
      }
    });

    it('should not duplicate global assets if they already exist', async () => {
      const systemUser = await User.create({
        _id: 'test-system',
        name: 'System',
        email: 'system@test.local',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await populationService.populateGlobalAssets(systemUser._id);
      const firstCount = await WorkspaceAssetModel.countDocuments({ isGlobal: true });

      await populationService.populateGlobalAssets(systemUser._id);
      const secondCount = await WorkspaceAssetModel.countDocuments({ isGlobal: true });

      expect(firstCount).toBe(secondCount);
      expect(firstCount).toBeGreaterThan(0);
    });

    it('should create assets with different types', async () => {
      const systemUser = await User.create({
        _id: 'test-system',
        name: 'System',
        email: 'system@test.local',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await populationService.populateGlobalAssets(systemUser._id);

      const icons = await WorkspaceAssetModel.find({ isGlobal: true, type: 'ICON' });
      const covers = await WorkspaceAssetModel.find({ isGlobal: true, type: 'COVER' });
      const themes = await WorkspaceAssetModel.find({ isGlobal: true, type: 'THEME_PRESET' });

      expect(icons.length).toBeGreaterThan(0);
      expect(covers.length).toBeGreaterThan(0);
      expect(themes.length).toBeGreaterThan(0);
    });
  });

  describe('populateDummyData', () => {
    it('should create users, assets, workspaces, and items', async () => {
      await populationService.populateDummyData();

      const users = await User.find({});
      const profiles = await UserProfileModel.find({});
      const assets = await WorkspaceAssetModel.find({});
      const workspaces = await WorkspaceModel.find({});
      const items = await WorkspaceItemModel.find({});

      expect(users.length).toBeGreaterThan(1); // At least system + demo users
      expect(profiles.length).toBe(users.length);
      expect(assets.length).toBeGreaterThan(0);
      expect(workspaces.length).toBeGreaterThan(0);
      expect(items.length).toBeGreaterThan(0);
    });

    it('should create global assets as part of full population', async () => {
      await populationService.populateDummyData();

      const globalAssets = await WorkspaceAssetModel.find({ isGlobal: true });
      expect(globalAssets.length).toBeGreaterThan(0);
    });

    it('should create user-specific assets', async () => {
      await populationService.populateDummyData();

      const userAssets = await WorkspaceAssetModel.find({ isGlobal: false });
      expect(userAssets.length).toBeGreaterThan(0);

      // Verify user assets are properly attributed
      for (const asset of userAssets) {
        expect(asset.userId).toBeDefined();
        expect(asset.userId).not.toBe('system');
      }
    });

    it('should create both public and private workspaces', async () => {
      await populationService.populateDummyData();

      const publicWorkspaces = await WorkspaceModel.find({ visibility: 'PUBLIC' });
      const privateWorkspaces = await WorkspaceModel.find({ visibility: 'PRIVATE' });

      expect(publicWorkspaces.length).toBeGreaterThan(0);
      expect(privateWorkspaces.length).toBeGreaterThan(0);
    });

    it('should create workspace items linked to workspaces', async () => {
      await populationService.populateDummyData();

      const workspaces = await WorkspaceModel.find({});
      const items = await WorkspaceItemModel.find({});

      expect(items.length).toBeGreaterThan(0);

      // Verify all items are linked to valid workspaces
      for (const item of items) {
        const workspace = workspaces.find((w) => w._id === item.workspaceId);
        expect(workspace).toBeDefined();
      }
    });

    it('should not duplicate data if run twice', async () => {
      await populationService.populateDummyData();
      const firstUserCount = await User.countDocuments();

      await populationService.populateDummyData();
      const secondUserCount = await User.countDocuments();

      expect(firstUserCount).toBe(secondUserCount);
      expect(firstUserCount).toBeGreaterThan(0);
    });
  });

  describe('populate', () => {
    it('should do nothing when mode is NONE', async () => {
      await populationService.populate('NONE');

      const users = await User.find({});
      const assets = await WorkspaceAssetModel.find({});

      expect(users.length).toBe(0);
      expect(assets.length).toBe(0);
    });

    it('should only create global assets when mode is ASSETS', async () => {
      await populationService.populate('ASSETS');

      const users = await User.find({});
      const globalAssets = await WorkspaceAssetModel.find({ isGlobal: true });
      const workspaces = await WorkspaceModel.find({});

      expect(users.length).toBe(1); // Only system user
      expect(users[0]._id).toBe('system');
      expect(globalAssets.length).toBeGreaterThan(0);
      expect(workspaces.length).toBe(0); // No workspaces in ASSETS mode
    });

    it('should create full dataset when mode is FULL', async () => {
      await populationService.populate('FULL');

      const users = await User.find({});
      const assets = await WorkspaceAssetModel.find({});
      const workspaces = await WorkspaceModel.find({});
      const items = await WorkspaceItemModel.find({});

      expect(users.length).toBeGreaterThan(1);
      expect(assets.length).toBeGreaterThan(0);
      expect(workspaces.length).toBeGreaterThan(0);
      expect(items.length).toBeGreaterThan(0);
    });

    it('should create system user and profile when populating assets', async () => {
      await populationService.populate('ASSETS');

      const systemUser = await User.findById('system');
      const systemProfile = await UserProfileModel.findOne({ userId: 'system' });

      expect(systemUser).toBeDefined();
      expect(systemUser?.name).toBe('System');
      expect(systemProfile).toBeDefined();
    });
  });
});
