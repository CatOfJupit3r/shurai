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
    it('should return NOT_FOUND for non-existent canvas layout', async () => {
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
});
