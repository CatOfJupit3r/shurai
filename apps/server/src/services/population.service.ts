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

    // Check if database is already populated
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      logger.info(`Found ${userCount} existing users, skipping full population`);
      return;
    }

    logger.info('Creating dummy users...');

    // Create system user for global assets
    const systemUser = await User.create({
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

    // Populate global assets first
    await this.populateGlobalAssets(systemUser._id);

    // Create dummy users
    const demoUser = await User.create({
      _id: 'demo-user-1',
      name: 'Demo User',
      email: 'demo@example.com',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await UserProfileModel.create({
      userId: demoUser._id,
      bio: 'This is a demo user account showcasing the Shurai platform!',
    });

    const secondUser = await User.create({
      _id: 'demo-user-2',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await UserProfileModel.create({
      userId: secondUser._id,
      bio: 'PC enthusiast and gaming setup collector',
    });

    logger.info('Creating dummy assets for users...');

    // Create some user-specific assets for demo user
    const demoUserAssets = await WorkspaceAssetModel.insertMany([
      {
        userId: demoUser._id,
        name: 'My Custom GPU Icon',
        description: 'Custom RTX 4090 icon',
        type: 'ICON',
        iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=custom-gpu',
        isGlobal: false,
      },
      {
        userId: demoUser._id,
        name: 'My Setup Photo',
        description: 'Photo of my actual setup',
        type: 'IMAGE',
        imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&h=600&fit=crop',
        isGlobal: false,
      },
      {
        userId: demoUser._id,
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
        userId: secondUser._id,
        name: 'Gaming Setup Cover',
        description: 'Cover image for gaming workspace',
        type: 'COVER',
        imageUrl: 'https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=1200&h=400&fit=crop',
        isGlobal: false,
      },
      {
        userId: secondUser._id,
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

    // Create public workspace for demo user
    const publicWorkspace = await WorkspaceModel.create({
      userId: demoUser._id,
      title: 'My Gaming Battlestation 2024',
      description:
        'My pride and joy - a high-end gaming setup featuring RTX 4090, AMD Ryzen 9, and custom RGB lighting throughout.',
      visibility: 'PUBLIC',
      shareableSlug: 'demo-gaming-setup-2024',
      coverAssetId: demoUserAssets[1]._id,
    });

    // Create private workspace for demo user
    const privateWorkspace = await WorkspaceModel.create({
      userId: demoUser._id,
      title: 'Work From Home Setup',
      description: 'My professional work setup - private configuration',
      visibility: 'PRIVATE',
    });

    // Create public workspace for Alice
    const aliceWorkspace = await WorkspaceModel.create({
      userId: secondUser._id,
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
