import { User } from '@~/db/models/auth.model';
import { UserProfileModel } from '@~/db/models/user-profile.model';
import { WorkspaceAssetModel } from '@~/db/models/workspace-asset.model';
import { WorkspaceItemModel } from '@~/db/models/workspace-item.model';
import { WorkspaceModel } from '@~/db/models/workspace.model';
import { createLogger } from '@~/lib/logger';

import { GLOBAL_ASSETS } from '../constants/global-assets';

const logger = createLogger('population');

class PopulationService {
  async populateGlobalAssets(systemUserId: string) {
    logger.info('Checking if global assets need to be populated...');

    const existingGlobalAssets = await WorkspaceAssetModel.countDocuments({ isGlobal: true });

    if (existingGlobalAssets > 0) {
      logger.info(`Found ${existingGlobalAssets} existing global assets, skipping population`);
      return;
    }

    logger.info(`Creating ${GLOBAL_ASSETS.length} global assets...`);

    const assets = GLOBAL_ASSETS.map((assetDef) => ({
      userId: systemUserId,
      name: assetDef.name,
      description: assetDef.description,
      type: assetDef.type,
      iconUrl: assetDef.iconUrl,
      imageUrl: assetDef.imageUrl,
      themeConfig: assetDef.themeConfig,
      isGlobal: true,
    }));

    await WorkspaceAssetModel.insertMany(assets);

    logger.info(`Successfully created ${GLOBAL_ASSETS.length} global assets`);
  }

  async populateDummyData() {
    logger.info('Starting full database population...');

    // Check if database is already populated (excluding system user)
    const userCount = await User.countDocuments({ _id: { $ne: 'system' } });
    if (userCount > 0) {
      logger.info(`Found ${userCount} existing users, skipping full population`);
      return;
    }

    logger.info('Creating dummy users...');

    // Import auth service to use Better Auth API
    const authService = (await import('./auth.service')).default;
    const auth = authService.getInstance();

    // Create or get system user for global assets
    let systemUser = await User.findById('system');
    if (!systemUser) {
      logger.info('Creating system user...');
      systemUser = await User.create({
        _id: 'system',
        name: 'System',
        email: 'system@shurai.local',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await UserProfileModel.create({
        userId: systemUser._id,
        bio: 'System user for global assets',
      });
    } else {
      logger.info('System user already exists, skipping creation');
    }

    // Populate global assets first
    await this.populateGlobalAssets(systemUser._id);

    // Create demo users using Better Auth's signUpEmail
    logger.info('Creating demo user account...');
    const demoUserResponse = await auth.api.signUpEmail({
      body: {
        email: 'demo@example.com',
        name: 'Demo User',
        username: 'demo',
        password: 'Demo123!@#',
      },
    });

    if (!demoUserResponse) {
      throw new Error('Failed to create demo user');
    }

    const demoUser = demoUserResponse.user;

    // Update the profile bio for demo user
    await UserProfileModel.findOneAndUpdate(
      { userId: demoUser.id },
      { bio: 'This is a demo user account showcasing the Shurai platform!' },
      { new: true },
    );

    logger.info('Creating Alice Johnson account...');
    const aliceResponse = await auth.api.signUpEmail({
      body: {
        email: 'alice@example.com',
        name: 'Alice Johnson',
        username: 'alice',
        password: 'Alice123!@#',
      },
    });

    if (!aliceResponse) {
      throw new Error('Failed to create Alice user');
    }

    const secondUser = aliceResponse.user;

    // Update the profile bio for Alice
    await UserProfileModel.findOneAndUpdate(
      { userId: secondUser.id },
      { bio: 'PC enthusiast and gaming setup collector' },
      { new: true },
    );

    logger.info('Creating dummy assets for users...');

    // Create some user-specific assets for demo user
    await WorkspaceAssetModel.insertMany([
      {
        userId: demoUser.id,
        name: 'My Custom GPU Icon',
        description: 'Custom RTX 4090 icon',
        type: 'ICON',
        iconUrl: 'http://localhost:3030/user-assets/items/custom-gpu-icon.png',
        isGlobal: false,
      },
      {
        userId: demoUser.id,
        name: 'My Setup Photo',
        description: 'Photo of my actual setup',
        type: 'IMAGE',
        imageUrl: 'http://localhost:3030/user-assets/items/demo-setup-photo.jpg',
        isGlobal: false,
      },
      {
        userId: demoUser.id,
        name: 'Personal Dark Theme',
        description: 'My customized dark theme',
        type: 'THEME_PRESET',
        themeConfig: {
          primaryColor: '#0d1117',
          secondaryColor: '#161b22',
          accentColor: '#58a6ff',
        },
        isGlobal: false,
      },
    ]);

    const aliceAssets = await WorkspaceAssetModel.insertMany([
      {
        userId: secondUser.id,
        name: 'Minimalist Setup Cover',
        description: 'Cover image for minimalist workspace',
        type: 'COVER',
        imageUrl: 'http://localhost:3030/user-assets/covers/alice-minimal-setup.jpg',
        isGlobal: false,
      },
      {
        userId: secondUser.id,
        name: 'Purple Theme',
        description: 'Custom purple accent theme',
        type: 'THEME_PRESET',
        themeConfig: {
          primaryColor: '#1e1b2e',
          secondaryColor: '#2a2640',
          accentColor: '#a855f7',
        },
        isGlobal: false,
      },
    ]);

    logger.info('Creating dummy workspaces...');

    // Create public workspace for demo user with cover image
    const demoWorkspaceCoverAsset = await WorkspaceAssetModel.create({
      userId: demoUser.id,
      name: 'Gaming Battlestation Cover',
      description: 'Cover image for my gaming setup',
      type: 'COVER',
      imageUrl: 'http://localhost:3030/user-assets/covers/demo-gaming-setup.jpg',
      isGlobal: false,
    });

    const publicWorkspace = await WorkspaceModel.create({
      userId: demoUser.id,
      title: 'My Gaming Battlestation 2024',
      description:
        'My pride and joy - a high-end gaming setup featuring RTX 4090, AMD Ryzen 9, and custom RGB lighting throughout.',
      visibility: 'PUBLIC',
      shareableSlug: 'demo-gaming-setup-2024',
      coverAssetId: demoWorkspaceCoverAsset._id,
    });

    // Create private workspace for demo user
    const privateWorkspace = await WorkspaceModel.create({
      userId: demoUser.id,
      title: 'Work From Home Setup',
      description: 'My professional work setup - private configuration',
      visibility: 'PRIVATE',
    });

    // Create public workspace for Alice
    const aliceWorkspace = await WorkspaceModel.create({
      userId: secondUser.id,
      title: 'Minimalist Productivity Setup',
      description:
        'Clean and minimal setup focused on productivity. Features an ultrawide monitor and ergonomic peripherals.',
      visibility: 'PUBLIC',
      shareableSlug: 'alice-minimal-setup',
      coverAssetId: aliceAssets[0]._id,
    });

    logger.info('Creating dummy workspace items...');

    // Get some global assets to use in items
    const globalAssets = await WorkspaceAssetModel.find({ isGlobal: true }).limit(10);
    const pcIcon = globalAssets.find((a) => a.name === 'Default PC Icon');
    const monitorIcon = globalAssets.find((a) => a.name === 'Monitor Icon');
    const keyboardIcon = globalAssets.find((a) => a.name === 'Keyboard Icon');
    const mouseIcon = globalAssets.find((a) => a.name === 'Mouse Icon');
    const gpuIcon = globalAssets.find((a) => a.name === 'GPU Icon');

    // Create items for public workspace
    await WorkspaceItemModel.insertMany([
      {
        workspaceId: publicWorkspace._id,
        name: 'Main PC',
        description: 'Custom built gaming PC',
        assetId: pcIcon?._id,
        parentId: null,
        order: 0,
      },
      {
        workspaceId: publicWorkspace._id,
        name: 'RTX 4090',
        description: 'NVIDIA GeForce RTX 4090 24GB',
        assetId: gpuIcon?._id,
        parentId: null,
        order: 1,
      },
      {
        workspaceId: publicWorkspace._id,
        name: 'Primary Monitor',
        description: 'Samsung Odyssey G9 49" Ultrawide',
        assetId: monitorIcon?._id,
        parentId: null,
        order: 2,
        acquireDate: new Date('2023-06-15'),
      },
      {
        workspaceId: publicWorkspace._id,
        name: 'Mechanical Keyboard',
        description: 'Custom built keyboard with Cherry MX switches',
        assetId: keyboardIcon?._id,
        parentId: null,
        order: 3,
      },
      {
        workspaceId: publicWorkspace._id,
        name: 'Gaming Mouse',
        description: 'Logitech G Pro X Superlight',
        assetId: mouseIcon?._id,
        parentId: null,
        order: 4,
        acquireDate: new Date('2024-01-10'),
      },
    ]);

    // Create items for private workspace
    await WorkspaceItemModel.insertMany([
      {
        workspaceId: privateWorkspace._id,
        name: 'Work Laptop',
        description: 'MacBook Pro 16"',
        assetId: pcIcon?._id,
        parentId: null,
        order: 0,
      },
      {
        workspaceId: privateWorkspace._id,
        name: 'External Monitor',
        description: 'Dell UltraSharp 27"',
        assetId: monitorIcon?._id,
        parentId: null,
        order: 1,
      },
    ]);

    // Create items for Alice's workspace
    await WorkspaceItemModel.insertMany([
      {
        workspaceId: aliceWorkspace._id,
        name: 'Productivity PC',
        description: 'Intel-based workstation',
        assetId: pcIcon?._id,
        parentId: null,
        order: 0,
      },
      {
        workspaceId: aliceWorkspace._id,
        name: 'Ultrawide Monitor',
        description: 'LG 38" UltraWide',
        assetId: monitorIcon?._id,
        parentId: null,
        order: 1,
      },
      {
        workspaceId: aliceWorkspace._id,
        name: 'Ergonomic Keyboard',
        description: 'Microsoft Ergonomic Keyboard',
        assetId: keyboardIcon?._id,
        parentId: null,
        order: 2,
      },
    ]);

    logger.info('Database population completed successfully');
  }

  async populate(mode: 'ASSETS' | 'FULL' | 'NONE') {
    if (mode === 'NONE') {
      logger.info('Population disabled via POPULATE_ON_EMPTY=NONE');
      return;
    }

    logger.info(`Starting population with mode: ${mode}`);

    try {
      if (mode === 'ASSETS') {
        // For ASSETS mode, check if we need to create system user
        let systemUser = await User.findById('system');
        if (!systemUser) {
          systemUser = await User.create({
            _id: 'system',
            name: 'System',
            email: 'system@shurai.local',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          await UserProfileModel.create({
            userId: systemUser._id,
            bio: 'System user for global assets',
          });
        }
        await this.populateGlobalAssets(systemUser._id);
      } else if (mode === 'FULL') {
        await this.populateDummyData();
      }
    } catch (error) {
      logger.error('Error during database population', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

export default new PopulationService();
