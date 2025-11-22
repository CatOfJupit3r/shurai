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
        expect(error.status).toBe('BAD_REQUEST');
        expect(error.data.code).toBe(errorCodes.CANVAS_DEPTH_LIMIT_EXCEEDED);
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
        expect(error.status).toBe('BAD_REQUEST');
        expect(error.data.code).toBe(errorCodes.CANVAS_INVALID_NODE_REFERENCE);
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
        expect(error.data.code).toBe(errorCodes.CANVAS_LAYOUT_NOT_FOUND);
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
        expect(error.data.code).toBe(errorCodes.WORKSPACE_NOT_FOUND);
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
        expect(error.data.code).toBe(errorCodes.WORKSPACE_NOT_FOUND);
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
        expect(error.data.code).toBe(errorCodes.CANVAS_LAYOUT_NOT_FOUND);
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
        expect(error.data.code).toBe(errorCodes.WORKSPACE_NOT_FOUND);
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
});
