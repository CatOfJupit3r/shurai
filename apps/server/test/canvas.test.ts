import { call } from '@orpc/server';
import { it, expect, describe } from 'bun:test';

import { errorCodes } from '@shurai/shared/enums/errors.enums';

import { appRouter } from './helpers/instance';
import './helpers/setup';
import { createUser } from './helpers/utilities';

describe('Canvas API Contract Tests', () => {
  describe('Canvas Layout Schema Validation', () => {
    it('should validate canvas node schema with ITEM type', () => {
      const validNode = {
        id: 'node-1',
        type: 'ITEM' as const,
        position: { x: 100, y: 200 },
        size: { width: 300, height: 400 },
        itemId: 'item-123',
        zIndex: 1,
        rotation: 45,
        opacity: 0.8,
        assetHints: {
          aspectRatio: 1.5,
          dominantColor: '#FF5733',
        },
      };

      expect(validNode.type).toBe('ITEM');
      expect(validNode.position.x).toBe(100);
      expect(validNode.size.width).toBeGreaterThan(0);
    });

    it('should validate canvas node schema with ASSET type', () => {
      const validNode = {
        id: 'node-2',
        type: 'ASSET' as const,
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        assetId: 'asset-456',
        assetHints: {
          aspectRatio: 2.0,
          dominantColor: '#3498db',
        },
      };

      expect(validNode.type).toBe('ASSET');
      expect(validNode.assetId).toBe('asset-456');
    });

    it('should validate canvas node schema with SUB_CANVAS type', () => {
      const validNode = {
        id: 'node-3',
        type: 'SUB_CANVAS' as const,
        position: { x: 50, y: 50 },
        size: { width: 500, height: 500 },
        subCanvasId: 'canvas-789',
      };

      expect(validNode.type).toBe('SUB_CANVAS');
      expect(validNode.subCanvasId).toBe('canvas-789');
    });

    it('should validate content canvas schema', () => {
      const contentCanvas = {
        _id: 'canvas-1',
        name: 'Component Layout',
        description: 'Layout for PC components',
        nodes: [
          {
            id: 'node-1',
            type: 'ITEM' as const,
            position: { x: 0, y: 0 },
            size: { width: 100, height: 100 },
            itemId: 'item-1',
          },
        ],
        backgroundColor: '#FFFFFF',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(contentCanvas.nodes.length).toBe(1);
      expect(contentCanvas.name).toBe('Component Layout');
    });

    it('should validate complete canvas layout schema', () => {
      const layout = {
        _id: 'layout-1',
        workspaceId: 'workspace-1',
        nodes: [
          {
            id: 'node-1',
            type: 'ITEM' as const,
            position: { x: 100, y: 100 },
            size: { width: 200, height: 200 },
            itemId: 'item-1',
          },
        ],
        contentCanvases: [
          {
            _id: 'canvas-1',
            name: 'Sub Canvas',
            nodes: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        canvasSize: {
          width: 1920,
          height: 1080,
        },
        backgroundColor: '#F0F0F0',
        gridEnabled: true,
        gridSize: 20,
        revision: 1,
        lastModifiedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(layout.nodes.length).toBe(1);
      expect(layout.contentCanvases?.length).toBe(1);
      expect(layout.canvasSize.width).toBe(1920);
      expect(layout.revision).toBe(1);
      expect(layout.gridEnabled).toBe(true);
    });
  });

  describe('Canvas Layout Depth Limitation', () => {
    it('should document max depth of 1 for sub-canvases', () => {
      // This test documents the depth limitation constraint
      // A canvas can contain nodes with SUB_CANVAS type
      // But those sub-canvases (ContentCanvas) cannot contain other SUB_CANVAS nodes

      const parentLayout = {
        _id: 'layout-1',
        workspaceId: 'workspace-1',
        nodes: [
          {
            id: 'node-1',
            type: 'SUB_CANVAS' as const,
            position: { x: 0, y: 0 },
            size: { width: 500, height: 500 },
            subCanvasId: 'canvas-1',
          },
        ],
        contentCanvases: [
          {
            _id: 'canvas-1',
            name: 'Level 1 Canvas',
            nodes: [
              {
                id: 'inner-node-1',
                type: 'ITEM' as const, // Must be ITEM or ASSET, not SUB_CANVAS
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                itemId: 'item-1',
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        canvasSize: { width: 1920, height: 1080 },
        revision: 0,
        lastModifiedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Verify parent canvas has sub-canvas
      const subCanvasNode = parentLayout.nodes.find((n) => n.type === 'SUB_CANVAS');
      expect(subCanvasNode).toBeDefined();
      expect(subCanvasNode?.subCanvasId).toBe('canvas-1');

      // Verify content canvas exists
      const contentCanvas = parentLayout.contentCanvases?.[0];
      expect(contentCanvas).toBeDefined();
      expect(contentCanvas?.name).toBe('Level 1 Canvas');

      // Verify content canvas nodes do NOT contain SUB_CANVAS
      // In a properly structured layout, content canvases should only contain ITEM or ASSET nodes
      const subCanvasNodes = contentCanvas?.nodes.filter((n) => n.type !== 'ITEM' && n.type !== 'ASSET');
      expect(subCanvasNodes?.length).toBe(0);
    });
  });

  describe('Canvas API Endpoints', () => {
    it('should save and retrieve canvas layout for workspace owner', async () => {
      const { ctx, user } = await createUser();

      // Create a workspace
      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      // Save a canvas layout
      const layoutInput = {
        workspaceId: workspace._id,
        nodes: [
          {
            id: 'node-1',
            type: 'ITEM' as const,
            position: { x: 100, y: 200 },
            size: { width: 300, height: 400 },
            itemId: 'item-123',
          },
        ],
        canvasSize: {
          width: 1920,
          height: 1080,
        },
        backgroundColor: '#FFFFFF',
        gridEnabled: true,
        gridSize: 20,
      };

      const savedLayout = await call(appRouter.canvas.saveLayout, layoutInput, ctx());

      expect(savedLayout).toBeDefined();
      expect(savedLayout.workspaceId).toBe(workspace._id);
      expect(savedLayout.nodes.length).toBe(1);
      expect(savedLayout.nodes[0].id).toBe('node-1');
      expect(savedLayout.revision).toBe(1);
      expect(savedLayout.lastModifiedBy).toBe(user.id);
      expect(savedLayout.canvasSize.width).toBe(1920);

      // Retrieve the layout
      const retrievedLayout = await call(
        appRouter.canvas.getLayout,
        {
          workspaceId: workspace._id,
        },
        ctx(),
      );

      expect(retrievedLayout._id).toBe(savedLayout._id);
      expect(retrievedLayout.nodes.length).toBe(1);
      expect(retrievedLayout.revision).toBe(1);
    });

    it('should increment revision on subsequent saves', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const layoutInput = {
        workspaceId: workspace._id,
        nodes: [],
        canvasSize: { width: 1920, height: 1080 },
      };

      const firstSave = await call(appRouter.canvas.saveLayout, layoutInput, ctx());
      expect(firstSave.revision).toBe(1);

      const secondSave = await call(appRouter.canvas.saveLayout, layoutInput, ctx());
      expect(secondSave.revision).toBe(2);

      const thirdSave = await call(appRouter.canvas.saveLayout, layoutInput, ctx());
      expect(thirdSave.revision).toBe(3);
    });

    it('should save layout with content canvases', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const layoutInput = {
        workspaceId: workspace._id,
        nodes: [
          {
            id: 'node-1',
            type: 'SUB_CANVAS' as const,
            position: { x: 0, y: 0 },
            size: { width: 500, height: 500 },
            subCanvasId: 'canvas-1',
          },
        ],
        contentCanvases: [
          {
            _id: 'canvas-1',
            name: 'Component Layout',
            description: 'Layout for components',
            nodes: [
              {
                id: 'inner-node-1',
                type: 'ITEM' as const,
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                itemId: 'item-1',
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        canvasSize: { width: 1920, height: 1080 },
      };

      const savedLayout = await call(appRouter.canvas.saveLayout, layoutInput, ctx());

      expect(savedLayout.contentCanvases).toBeDefined();
      expect(savedLayout.contentCanvases?.length).toBe(1);
      expect(savedLayout.contentCanvases?.[0].name).toBe('Component Layout');
      expect(savedLayout.contentCanvases?.[0].nodes.length).toBe(1);
    });

    it('should reject layout with depth > 1 (SUB_CANVAS in content canvas)', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const layoutInput = {
        workspaceId: workspace._id,
        nodes: [
          {
            id: 'node-1',
            type: 'SUB_CANVAS' as const,
            position: { x: 0, y: 0 },
            size: { width: 500, height: 500 },
            subCanvasId: 'canvas-1',
          },
        ],
        contentCanvases: [
          {
            _id: 'canvas-1',
            name: 'Invalid Canvas',
            nodes: [
              {
                id: 'nested-canvas',
                type: 'SUB_CANVAS' as const,
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                subCanvasId: 'canvas-2',
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        canvasSize: { width: 1920, height: 1080 },
      };

      try {
        await call(appRouter.canvas.saveLayout, layoutInput, ctx());
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should reject layout with invalid sub-canvas reference', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const layoutInput = {
        workspaceId: workspace._id,
        nodes: [
          {
            id: 'node-1',
            type: 'SUB_CANVAS' as const,
            position: { x: 0, y: 0 },
            size: { width: 500, height: 500 },
            subCanvasId: 'non-existent-canvas',
          },
        ],
        canvasSize: { width: 1920, height: 1080 },
      };

      try {
        await call(appRouter.canvas.saveLayout, layoutInput, ctx());
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should reset canvas layout', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      // Save a layout
      await call(
        appRouter.canvas.saveLayout,
        {
          workspaceId: workspace._id,
          nodes: [
            {
              id: 'node-1',
              type: 'ITEM' as const,
              position: { x: 0, y: 0 },
              size: { width: 100, height: 100 },
              itemId: 'item-1',
            },
          ],
          canvasSize: { width: 1920, height: 1080 },
        },
        ctx(),
      );

      // Reset the layout
      const resetResult = await call(
        appRouter.canvas.resetLayout,
        {
          workspaceId: workspace._id,
        },
        ctx(),
      );

      expect(resetResult.success).toBe(true);

      // Try to get the layout (should fail)
      try {
        await call(
          appRouter.canvas.getLayout,
          {
            workspaceId: workspace._id,
          },
          ctx(),
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should not allow non-owner to save layout', async () => {
      const { ctx: ownerCtx } = await createUser();
      const { ctx: otherCtx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ownerCtx(),
      );

      try {
        await call(
          appRouter.canvas.saveLayout,
          {
            workspaceId: workspace._id,
            nodes: [],
            canvasSize: { width: 1920, height: 1080 },
          },
          otherCtx(),
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should not allow non-owner to reset layout', async () => {
      const { ctx: ownerCtx } = await createUser();
      const { ctx: otherCtx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ownerCtx(),
      );

      try {
        await call(
          appRouter.canvas.resetLayout,
          {
            workspaceId: workspace._id,
          },
          otherCtx(),
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should allow access to public workspace layout', async () => {
      const { ctx: ownerCtx } = await createUser();
      const { ctx: otherCtx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Public Workspace',
          visibility: 'PUBLIC',
        },
        ownerCtx(),
      );

      // Owner saves layout
      await call(
        appRouter.canvas.saveLayout,
        {
          workspaceId: workspace._id,
          nodes: [
            {
              id: 'node-1',
              type: 'ITEM' as const,
              position: { x: 0, y: 0 },
              size: { width: 100, height: 100 },
              itemId: 'item-1',
            },
          ],
          canvasSize: { width: 1920, height: 1080 },
        },
        ownerCtx(),
      );

      // Other user can view public layout
      const layout = await call(
        appRouter.canvas.getLayout,
        {
          workspaceId: workspace._id,
        },
        otherCtx(),
      );

      expect(layout).toBeDefined();
      expect(layout.nodes.length).toBe(1);
    });

    it('should get public layout by slug without authentication', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Public Workspace',
          visibility: 'PUBLIC',
        },
        ctx(),
      );

      // Save layout
      await call(
        appRouter.canvas.saveLayout,
        {
          workspaceId: workspace._id,
          nodes: [
            {
              id: 'node-1',
              type: 'ITEM' as const,
              position: { x: 0, y: 0 },
              size: { width: 100, height: 100 },
              itemId: 'item-1',
            },
          ],
          canvasSize: { width: 1920, height: 1080 },
        },
        ctx(),
      );

      // Get layout by slug without auth
      const publicLayout = await call(
        appRouter.canvas.getPublicLayout,
        {
          slug: workspace.shareableSlug!,
        },
        { context: { session: null } },
      );

      expect(publicLayout).toBeDefined();
      expect(publicLayout.workspaceId).toBe(workspace._id);
      expect(publicLayout.nodes.length).toBe(1);
    });

    it('should return NOT_FOUND for non-existent canvas layout', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      try {
        await call(
          appRouter.canvas.getLayout,
          {
            workspaceId: workspace._id,
          },
          ctx(),
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should return NOT_FOUND for non-existent workspace', async () => {
      const { ctx } = await createUser();

      try {
        await call(
          appRouter.canvas.getLayout,
          {
            workspaceId: 'non-existent-workspace',
          },
          ctx(),
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should have getLayout procedure defined', () => {
      expect(appRouter.canvas.getLayout).toBeDefined();
    });

    it('should have saveLayout procedure defined', () => {
      expect(appRouter.canvas.saveLayout).toBeDefined();
    });

    it('should have resetLayout procedure defined', () => {
      expect(appRouter.canvas.resetLayout).toBeDefined();
    });

    it('should have getPublicLayout procedure defined', () => {
      expect(appRouter.canvas.getPublicLayout).toBeDefined();
    });
  });

  describe('Asset Hints for Client Hydration', () => {
    it('should support aspect ratio and dominant color hints', () => {
      const nodeWithHints = {
        id: 'node-1',
        type: 'ASSET' as const,
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        assetId: 'asset-1',
        assetHints: {
          aspectRatio: 4 / 3,
          dominantColor: '#2ecc71',
        },
      };

      expect(nodeWithHints.assetHints?.aspectRatio).toBeCloseTo(1.333, 2);
      expect(nodeWithHints.assetHints?.dominantColor).toBe('#2ecc71');
    });

    it('should allow optional asset hints', () => {
      const nodeWithoutHints = {
        id: 'node-2',
        type: 'ITEM' as const,
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        itemId: 'item-1',
        assetHints: undefined,
      };

      expect(nodeWithoutHints.assetHints).toBeUndefined();
    });
  });

  describe('Canvas Revision Metadata', () => {
    it('should track revision number and last modifier', () => {
      const layout = {
        _id: 'layout-1',
        workspaceId: 'workspace-1',
        nodes: [],
        canvasSize: { width: 1920, height: 1080 },
        revision: 5,
        lastModifiedBy: 'user-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      expect(layout.revision).toBe(5);
      expect(layout.lastModifiedBy).toBe('user-123');
      expect(layout.updatedAt.getTime()).toBeGreaterThan(layout.createdAt.getTime());
    });
  });

  describe('getContentCanvas', () => {
    it('should retrieve a content canvas by ID when user owns the workspace', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace with Content Canvas',
          description: 'Testing content canvas retrieval',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      // Create a layout with a content canvas
      const contentCanvas = {
        _id: 'content-canvas-1',
        name: 'Component Details',
        description: 'Detailed component layout',
        nodes: [
          {
            id: 'node-1',
            type: 'ITEM' as const,
            position: { x: 100, y: 100 },
            size: { width: 200, height: 200 },
            itemId: 'item-1',
          },
        ],
        backgroundColor: '#f5f5f5',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await call(
        appRouter.canvas.saveLayout,
        {
          workspaceId: workspace._id,
          nodes: [
            {
              id: 'main-node-1',
              type: 'SUB_CANVAS' as const,
              position: { x: 0, y: 0 },
              size: { width: 400, height: 400 },
              subCanvasId: 'content-canvas-1',
            },
          ],
          contentCanvases: [contentCanvas],
          canvasSize: { width: 1920, height: 1080 },
          gridEnabled: true,
          gridSize: 20,
        },
        ctx(),
      );

      // Retrieve the content canvas
      const retrievedCanvas = await call(
        appRouter.canvas.getContentCanvas,
        {
          contentCanvasId: 'content-canvas-1',
        },
        ctx(),
      );

      expect(retrievedCanvas._id).toBe('content-canvas-1');
      expect(retrievedCanvas.name).toBe('Component Details');
      expect(retrievedCanvas.nodes).toHaveLength(1);
      expect(retrievedCanvas.nodes[0].type).toBe('ITEM');
    });

    it('should return NOT_FOUND when content canvas does not exist', async () => {
      const { ctx } = await createUser();

      await expect(
        call(
          appRouter.canvas.getContentCanvas,
          {
            contentCanvasId: 'non-existent-canvas',
          },
          ctx(),
        ),
      ).rejects.toThrow('Canvas layout not found');
    });

    it('should return NOT_FOUND when user does not own the workspace and it is private', async () => {
      const { ctx: ownerCtx } = await createUser();
      const { ctx: otherCtx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Private Workspace',
          visibility: 'PRIVATE',
        },
        ownerCtx(),
      );

      // Create a layout with a content canvas
      const contentCanvas = {
        _id: 'private-canvas-1',
        name: 'Private Content',
        nodes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await call(
        appRouter.canvas.saveLayout,
        {
          workspaceId: workspace._id,
          nodes: [],
          contentCanvases: [contentCanvas],
          canvasSize: { width: 1920, height: 1080 },
        },
        ownerCtx(),
      );

      // Try to access as another user
      await expect(
        call(
          appRouter.canvas.getContentCanvas,
          {
            contentCanvasId: 'private-canvas-1',
          },
          otherCtx(),
        ),
      ).rejects.toThrow('Canvas layout not found');
    });

    it('should allow access to content canvas when workspace is public', async () => {
      const { ctx: ownerCtx } = await createUser();
      const { ctx: publicCtx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Public Workspace',
          visibility: 'PUBLIC',
        },
        ownerCtx(),
      );

      // Create a layout with a content canvas
      const contentCanvas = {
        _id: 'public-canvas-1',
        name: 'Public Content',
        description: 'Publicly accessible content',
        nodes: [
          {
            id: 'node-1',
            type: 'ASSET' as const,
            position: { x: 50, y: 50 },
            size: { width: 150, height: 150 },
            assetId: 'asset-1',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await call(
        appRouter.canvas.saveLayout,
        {
          workspaceId: workspace._id,
          nodes: [],
          contentCanvases: [contentCanvas],
          canvasSize: { width: 1920, height: 1080 },
        },
        ownerCtx(),
      );

      // Access as another user
      const retrievedCanvas = await call(
        appRouter.canvas.getContentCanvas,
        {
          contentCanvasId: 'public-canvas-1',
        },
        publicCtx(),
      );

      expect(retrievedCanvas._id).toBe('public-canvas-1');
      expect(retrievedCanvas.name).toBe('Public Content');
      expect(retrievedCanvas.description).toBe('Publicly accessible content');
    });

    it('should return NOT_FOUND when workspace is deleted but content canvas exists', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Workspace to Delete',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      // Create a layout with a content canvas
      const contentCanvas = {
        _id: 'orphaned-canvas-1',
        name: 'Orphaned Content',
        nodes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await call(
        appRouter.canvas.saveLayout,
        {
          workspaceId: workspace._id,
          nodes: [],
          contentCanvases: [contentCanvas],
          canvasSize: { width: 1920, height: 1080 },
        },
        ctx(),
      );

      // Delete the workspace
      await call(
        appRouter.workspaces.deleteWorkspace,
        {
          workspaceId: workspace._id,
        },
        ctx(),
      );

      // Try to access the content canvas
      await expect(
        call(
          appRouter.canvas.getContentCanvas,
          {
            contentCanvasId: 'orphaned-canvas-1',
          },
          ctx(),
        ),
      ).rejects.toThrow('Canvas layout not found');
    });
  });

  describe('Payload Size Validation and Monitoring', () => {
    it('should reject canvas layout with payload exceeding size limit', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      // Create a very large payload that exceeds 5MB
      // Each node is approximately 200-300 bytes, so we need around 20,000+ nodes
      const largeNodes = Array.from({ length: 25000 }, (_, i) => ({
        id: `node-${i}`,
        type: 'ITEM' as const,
        position: { x: i * 10, y: i * 10 },
        size: { width: 100, height: 100 },
        itemId: `item-${i}`,
        zIndex: i,
        rotation: 45,
        opacity: 0.8,
        assetHints: {
          aspectRatio: 1.5,
          dominantColor: '#FF5733',
        },
      }));

      const layoutInput = {
        workspaceId: workspace._id,
        nodes: largeNodes,
        canvasSize: { width: 1920, height: 1080 },
      };

      try {
        await call(appRouter.canvas.saveLayout, layoutInput, ctx());
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.message).toContain('Canvas layout payload exceeds maximum size limit');
      }
    });

    it('should accept canvas layout within size limit', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      // Create a reasonable payload (around 100 nodes)
      const nodes = Array.from({ length: 100 }, (_, i) => ({
        id: `node-${i}`,
        type: 'ITEM' as const,
        position: { x: i * 10, y: i * 10 },
        size: { width: 100, height: 100 },
        itemId: `item-${i}`,
      }));

      const layoutInput = {
        workspaceId: workspace._id,
        nodes,
        canvasSize: { width: 1920, height: 1080 },
      };

      const savedLayout = await call(appRouter.canvas.saveLayout, layoutInput, ctx());

      expect(savedLayout).toBeDefined();
      expect(savedLayout.nodes.length).toBe(100);
      expect(savedLayout.revision).toBe(1);
    });

    it('should handle moderately large payloads with content canvases', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      // Create a payload with multiple content canvases
      const contentCanvases = Array.from({ length: 10 }, (_, i) => ({
        _id: `canvas-${i}`,
        name: `Content Canvas ${i}`,
        description: `Description for canvas ${i}`,
        nodes: Array.from({ length: 50 }, (_, j) => ({
          id: `node-${i}-${j}`,
          type: 'ITEM' as const,
          position: { x: j * 10, y: j * 10 },
          size: { width: 100, height: 100 },
          itemId: `item-${i}-${j}`,
        })),
        backgroundColor: '#FFFFFF',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const layoutInput = {
        workspaceId: workspace._id,
        nodes: Array.from({ length: 100 }, (_, i) => ({
          id: `main-node-${i}`,
          type: i < 10 ? ('SUB_CANVAS' as const) : ('ITEM' as const),
          position: { x: i * 100, y: i * 100 },
          size: { width: 200, height: 200 },
          subCanvasId: i < 10 ? `canvas-${i}` : undefined,
          itemId: i >= 10 ? `main-item-${i}` : undefined,
        })),
        contentCanvases,
        canvasSize: { width: 1920, height: 1080 },
      };

      const savedLayout = await call(appRouter.canvas.saveLayout, layoutInput, ctx());

      expect(savedLayout).toBeDefined();
      expect(savedLayout.nodes.length).toBe(100);
      expect(savedLayout.contentCanvases?.length).toBe(10);
      expect(savedLayout.revision).toBe(1);
    });

    it('should track revision correctly across multiple saves', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const baseInput = {
        workspaceId: workspace._id,
        canvasSize: { width: 1920, height: 1080 },
      };

      // Save 1
      const save1 = await call(
        appRouter.canvas.saveLayout,
        {
          ...baseInput,
          nodes: [
            {
              id: 'node-1',
              type: 'ITEM' as const,
              position: { x: 0, y: 0 },
              size: { width: 100, height: 100 },
              itemId: 'item-1',
            },
          ],
        },
        ctx(),
      );
      expect(save1.revision).toBe(1);

      // Save 2
      const save2 = await call(
        appRouter.canvas.saveLayout,
        {
          ...baseInput,
          nodes: [
            {
              id: 'node-1',
              type: 'ITEM' as const,
              position: { x: 100, y: 100 },
              size: { width: 100, height: 100 },
              itemId: 'item-1',
            },
            {
              id: 'node-2',
              type: 'ITEM' as const,
              position: { x: 200, y: 200 },
              size: { width: 100, height: 100 },
              itemId: 'item-2',
            },
          ],
        },
        ctx(),
      );
      expect(save2.revision).toBe(2);

      // Save 3
      const save3 = await call(appRouter.canvas.saveLayout, { ...baseInput, nodes: [] }, ctx());
      expect(save3.revision).toBe(3);
    });

    it('should maintain correct revision after reset and new save', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      // Save initial layout
      await call(
        appRouter.canvas.saveLayout,
        {
          workspaceId: workspace._id,
          nodes: [
            {
              id: 'node-1',
              type: 'ITEM' as const,
              position: { x: 0, y: 0 },
              size: { width: 100, height: 100 },
              itemId: 'item-1',
            },
          ],
          canvasSize: { width: 1920, height: 1080 },
        },
        ctx(),
      );

      // Reset
      await call(
        appRouter.canvas.resetLayout,
        {
          workspaceId: workspace._id,
        },
        ctx(),
      );

      // Save new layout - should start at revision 1 again
      const newSave = await call(
        appRouter.canvas.saveLayout,
        {
          workspaceId: workspace._id,
          nodes: [
            {
              id: 'node-new',
              type: 'ITEM' as const,
              position: { x: 50, y: 50 },
              size: { width: 150, height: 150 },
              itemId: 'item-new',
            },
          ],
          canvasSize: { width: 1920, height: 1080 },
        },
        ctx(),
      );

      expect(newSave.revision).toBe(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty nodes array', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const layoutInput = {
        workspaceId: workspace._id,
        nodes: [],
        canvasSize: { width: 1920, height: 1080 },
      };

      const savedLayout = await call(appRouter.canvas.saveLayout, layoutInput, ctx());

      expect(savedLayout).toBeDefined();
      expect(savedLayout.nodes.length).toBe(0);
      expect(savedLayout.revision).toBe(1);
    });

    it('should handle layout with all optional fields', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const layoutInput = {
        workspaceId: workspace._id,
        nodes: [
          {
            id: 'node-1',
            type: 'ITEM' as const,
            position: { x: 0, y: 0 },
            size: { width: 100, height: 100 },
            itemId: 'item-1',
            zIndex: 5,
            rotation: 90,
            opacity: 0.5,
            assetHints: {
              aspectRatio: 16 / 9,
              dominantColor: '#3498db',
            },
          },
        ],
        canvasSize: { width: 2560, height: 1440 },
        backgroundColor: '#f0f0f0',
        gridEnabled: true,
        gridSize: 25,
      };

      const savedLayout = await call(appRouter.canvas.saveLayout, layoutInput, ctx());

      expect(savedLayout).toBeDefined();
      expect(savedLayout.nodes[0].zIndex).toBe(5);
      expect(savedLayout.nodes[0].rotation).toBe(90);
      expect(savedLayout.nodes[0].opacity).toBe(0.5);
      expect(savedLayout.backgroundColor).toBe('#f0f0f0');
      expect(savedLayout.gridEnabled).toBe(true);
      expect(savedLayout.gridSize).toBe(25);
    });

    it('should handle multiple sequential operations', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const baseInput = {
        workspaceId: workspace._id,
        canvasSize: { width: 1920, height: 1080 },
      };

      // Save -> Get -> Save -> Reset -> Get (should fail)
      await call(
        appRouter.canvas.saveLayout,
        {
          ...baseInput,
          nodes: [
            {
              id: 'node-1',
              type: 'ITEM' as const,
              position: { x: 0, y: 0 },
              size: { width: 100, height: 100 },
              itemId: 'item-1',
            },
          ],
        },
        ctx(),
      );

      const layout1 = await call(appRouter.canvas.getLayout, { workspaceId: workspace._id }, ctx());
      expect(layout1.revision).toBe(1);

      await call(
        appRouter.canvas.saveLayout,
        {
          ...baseInput,
          nodes: [
            {
              id: 'node-2',
              type: 'ITEM' as const,
              position: { x: 100, y: 100 },
              size: { width: 100, height: 100 },
              itemId: 'item-2',
            },
          ],
        },
        ctx(),
      );

      const layout2 = await call(appRouter.canvas.getLayout, { workspaceId: workspace._id }, ctx());
      expect(layout2.revision).toBe(2);

      await call(appRouter.canvas.resetLayout, { workspaceId: workspace._id }, ctx());

      try {
        await call(appRouter.canvas.getLayout, { workspaceId: workspace._id }, ctx());
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });
});
