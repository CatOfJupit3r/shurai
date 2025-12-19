import { errorCodes } from '@shurai/shared/enums/errors.enums';

import { ObjectIdString } from '@~/db/helpers';
import { createLogger } from '@~/lib/logger';
import { ORPCBadRequestError, ORPCNotFoundError } from '@~/lib/orpc-error-wrapper';

import { WorkspaceContentCanvasModel } from '../db/models/canvas-layout.model';
import type { CanvasNodeClass } from '../db/models/canvas-layout.model';
import { WorkspaceItemModel } from '../db/models/workspace-item.model';
import { WorkspaceModel } from '../db/models/workspace.model';

const MAX_PAYLOAD_SIZE_BYTES = 1024 * 1024 * 5; // 5MB limit
const PAYLOAD_SIZE_WARNING_THRESHOLD = 1024 * 1024 * 4; // 4MB warning threshold

interface iCanvasNode {
  id: string;
  type: 'ITEM' | 'ASSET' | 'SUB_CANVAS';
  position: { x: number; y: number };
  size: { width: number; height: number };
  itemId?: string;
  assetId?: string;
  subCanvasId?: string;
  zIndex?: number;
  rotation?: number;
  opacity?: number;
  assetHints?: {
    aspectRatio?: number;
    dominantColor?: string;
  };
}

interface iContentCanvas {
  _id: string;
  name: string;
  description?: string;
  nodes: iCanvasNode[];
  backgroundColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface iSaveLayoutInput {
  workspaceId: string;
  nodes: iCanvasNode[];
  contentCanvases?: iContentCanvas[];
  canvasSize: {
    width: number;
    height: number;
  };
  backgroundColor?: string;
  gridEnabled?: boolean;
  gridSize?: number;
}

class CanvasService {
  private logger = createLogger('canvas');

  /**
   * Calculate the approximate size of a payload in bytes
   */
  private calculatePayloadSize(input: iSaveLayoutInput): number {
    return JSON.stringify(input).length;
  }

  /**
   * Validate payload size and log warnings/errors
   */
  private validatePayloadSize(input: iSaveLayoutInput, workspaceId: string, userId: string) {
    const payloadSize = this.calculatePayloadSize(input);

    if (payloadSize > MAX_PAYLOAD_SIZE_BYTES) {
      this.logger.error('Canvas layout payload too large', {
        workspaceId,
        userId,
        payloadSize,
        maxSize: MAX_PAYLOAD_SIZE_BYTES,
        nodesCount: input.nodes.length,
        contentCanvasesCount: input.contentCanvases?.length ?? 0,
      });
      throw ORPCBadRequestError(errorCodes.CANVAS_PAYLOAD_TOO_LARGE);
    }

    if (payloadSize > PAYLOAD_SIZE_WARNING_THRESHOLD) {
      this.logger.warn('Canvas layout payload approaching size limit', {
        workspaceId,
        userId,
        payloadSize,
        maxSize: MAX_PAYLOAD_SIZE_BYTES,
        threshold: PAYLOAD_SIZE_WARNING_THRESHOLD,
        percentageUsed: ((payloadSize / MAX_PAYLOAD_SIZE_BYTES) * 100).toFixed(2),
        nodesCount: input.nodes.length,
        contentCanvasesCount: input.contentCanvases?.length ?? 0,
      });
    }

    return payloadSize;
  }

  /**
   * Validates that content canvases don't exceed depth limit of 1
   * and that nodes don't reference non-existent content canvases
   */
  private validateDepthLimit(nodes: iCanvasNode[], contentCanvases?: iContentCanvas[]) {
    const contentCanvasIds = new Set(contentCanvases?.map((c) => c._id) ?? []);

    // Check main nodes for SUB_CANVAS references
    nodes.forEach((node) => {
      if (node.type === 'SUB_CANVAS' && node.subCanvasId) {
        if (!contentCanvasIds.has(node.subCanvasId)) {
          throw ORPCBadRequestError(errorCodes.CANVAS_INVALID_NODE_REFERENCE);
        }
      }
    });

    // Check content canvas nodes for SUB_CANVAS type (not allowed at depth 1)
    contentCanvases?.forEach((canvas) => {
      canvas.nodes.forEach((node) => {
        if (node.type === 'SUB_CANVAS') {
          throw ORPCBadRequestError(errorCodes.CANVAS_DEPTH_LIMIT_EXCEEDED);
        }
      });
    });
  }

  /**
   * Validates that referenced items and assets exist in the workspace
   * Logs warnings for violations but doesn't block (as per requirements)
   */
  private async validateReferences(workspaceId: string, nodes: iCanvasNode[], contentCanvases?: iContentCanvas[]) {
    const allNodes = [...nodes, ...(contentCanvases?.flatMap((c) => c.nodes) ?? [])];

    const itemIds = allNodes.filter((n) => n.type === 'ITEM' && n.itemId).map((n) => n.itemId as string);
    // Note: We're not validating assets yet as the asset model might not be fully implemented
    // This is intentional for the initial rollout

    if (itemIds.length > 0) {
      const existingItems = await WorkspaceItemModel.find({
        _id: { $in: itemIds },
        workspaceId,
      });

      const existingItemIds = new Set(existingItems.map((item) => item._id));
      const missingItemIds = itemIds.filter((id) => !existingItemIds.has(id));

      if (missingItemIds.length > 0) {
        this.logger.warn(`Canvas layout references non-existent items in workspace ${workspaceId}:`, {
          missingItemIds,
        });
      }
    }
  }

  /**
   * Gets the canvas layout for a workspace
   */
  async getLayout(workspaceId: string, userId: string) {
    const startTime = Date.now();

    try {
      const workspace = await WorkspaceModel.findById(workspaceId);

      if (!workspace) {
        this.logger.warn('Canvas layout retrieval failed - workspace not found', {
          workspaceId,
          userId,
          duration: Date.now() - startTime,
        });
        throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
      }

      // Check access: user must own the workspace or it must be public
      if (workspace.userId !== userId && workspace.visibility !== 'PUBLIC') {
        this.logger.warn('Canvas layout retrieval failed - access denied', {
          workspaceId,
          userId,
          ownerId: workspace.userId,
          visibility: workspace.visibility,
          duration: Date.now() - startTime,
        });
        throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
      }

      // Auto-create canvas layout if it doesn't exist
      if (!workspace.canvasLayout) {
        this.logger.info('Canvas layout not found, creating default layout', {
          workspaceId,
          userId,
        });

        workspace.canvasLayout = {
          _id: ObjectIdString(),
          nodes: [],
          canvasSize: { width: 1440, height: 810 },
          backgroundColor: undefined,
          gridEnabled: true,
          gridSize: 20,
          revision: 0,
          lastModifiedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await workspace.save();

        this.logger.info('Default canvas layout created successfully', {
          workspaceId,
          userId,
          canvasLayoutId: workspace.canvasLayout._id,
        });
      }

      // Fetch associated content canvases
      const contentCanvases = await WorkspaceContentCanvasModel.find({ workspaceId });

      const result = {
        _id: workspace.canvasLayout._id,
        workspaceId,
        nodes: workspace.canvasLayout.nodes,
        contentCanvases: contentCanvases.map((c) => ({
          _id: c._id,
          name: c.name,
          description: c.description,
          nodes: c.nodes,
          backgroundColor: c.backgroundColor,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        canvasSize: workspace.canvasLayout.canvasSize,
        backgroundColor: workspace.canvasLayout.backgroundColor,
        gridEnabled: workspace.canvasLayout.gridEnabled,
        gridSize: workspace.canvasLayout.gridSize,
        revision: workspace.canvasLayout.revision,
        lastModifiedBy: workspace.canvasLayout.lastModifiedBy,
        createdAt: workspace.canvasLayout.createdAt,
        updatedAt: workspace.canvasLayout.updatedAt,
      };

      this.logger.info('Canvas layout retrieved successfully', {
        workspaceId,
        userId,
        revision: workspace.canvasLayout.revision,
        nodesCount: workspace.canvasLayout.nodes.length,
        contentCanvasesCount: contentCanvases.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        // Re-throw known errors
        throw error;
      }
      this.logger.error('Canvas layout retrieval failed - unexpected error', {
        workspaceId,
        userId,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Gets the public canvas layout by workspace slug
   */
  async getPublicLayout(slug: string) {
    const startTime = Date.now();

    try {
      const workspace = await WorkspaceModel.findOne({ shareableSlug: slug, visibility: 'PUBLIC' });

      if (!workspace) {
        this.logger.warn('Public canvas layout retrieval failed - workspace not found', {
          slug,
          duration: Date.now() - startTime,
        });
        throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
      }

      if (!workspace.canvasLayout) {
        this.logger.warn('Public canvas layout retrieval failed - layout not found', {
          slug,
          workspaceId: workspace._id,
          duration: Date.now() - startTime,
        });
        throw ORPCNotFoundError(errorCodes.CANVAS_LAYOUT_NOT_FOUND);
      }

      // Fetch associated content canvases
      const contentCanvases = await WorkspaceContentCanvasModel.find({ workspaceId: workspace._id });

      const result = {
        _id: workspace.canvasLayout._id,
        workspaceId: workspace._id,
        nodes: workspace.canvasLayout.nodes,
        contentCanvases: contentCanvases.map((c) => ({
          _id: c._id,
          name: c.name,
          description: c.description,
          nodes: c.nodes,
          backgroundColor: c.backgroundColor,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        canvasSize: workspace.canvasLayout.canvasSize,
        backgroundColor: workspace.canvasLayout.backgroundColor,
        gridEnabled: workspace.canvasLayout.gridEnabled,
        gridSize: workspace.canvasLayout.gridSize,
        revision: workspace.canvasLayout.revision,
        lastModifiedBy: workspace.canvasLayout.lastModifiedBy,
        createdAt: workspace.canvasLayout.createdAt,
        updatedAt: workspace.canvasLayout.updatedAt,
      };

      this.logger.info('Public canvas layout retrieved successfully', {
        slug,
        workspaceId: workspace._id,
        revision: workspace.canvasLayout.revision,
        nodesCount: workspace.canvasLayout.nodes.length,
        contentCanvasesCount: contentCanvases.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        // Re-throw known errors
        throw error;
      }
      this.logger.error('Public canvas layout retrieval failed - unexpected error', {
        slug,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Saves or updates the canvas layout for a workspace
   */
  async saveLayout(input: iSaveLayoutInput, userId: string) {
    const { workspaceId, nodes, contentCanvases, canvasSize, backgroundColor, gridSize } = input;
    const isGridEnabled = input.gridEnabled;
    const startTime = Date.now();

    try {
      // Validate payload size first
      const payloadSize = this.validatePayloadSize(input, workspaceId, userId);

      const workspace = await WorkspaceModel.findById(workspaceId);

      if (!workspace || workspace.userId !== userId) {
        this.logger.warn('Canvas layout save failed - workspace not found or access denied', {
          workspaceId,
          userId,
          found: !!workspace,
          isOwner: workspace?.userId === userId,
          duration: Date.now() - startTime,
        });
        throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
      }

      // Validate depth limit and references
      this.validateDepthLimit(nodes, contentCanvases);
      await this.validateReferences(workspaceId, nodes, contentCanvases);

      const now = new Date();
      const currentRevision = workspace.canvasLayout?.revision ?? 0;
      const newRevision = currentRevision + 1;

      // Update or create embedded canvas layout
      workspace.canvasLayout = {
        _id: workspace.canvasLayout?._id ?? ObjectIdString(),
        nodes: nodes as CanvasNodeClass[],
        canvasSize,
        backgroundColor,
        gridEnabled: isGridEnabled,
        gridSize,
        revision: newRevision,
        lastModifiedBy: userId,
        createdAt: workspace.canvasLayout?.createdAt ?? now,
        updatedAt: now,
      };

      await workspace.save();

      // Handle content canvases: remove old ones and create new ones
      await WorkspaceContentCanvasModel.deleteMany({ workspaceId });

      if (contentCanvases && contentCanvases.length > 0) {
        await WorkspaceContentCanvasModel.insertMany(
          contentCanvases.map((canvas) => ({
            _id: canvas._id,
            workspaceId,
            name: canvas.name,
            description: canvas.description,
            nodes: canvas.nodes,
            backgroundColor: canvas.backgroundColor,
            createdAt: canvas.createdAt ?? now,
            updatedAt: canvas.updatedAt ?? now,
          })),
        );
      }

      // Fetch updated content canvases
      const savedContentCanvases = await WorkspaceContentCanvasModel.find({ workspaceId });

      const result = {
        _id: workspace.canvasLayout._id,
        workspaceId,
        nodes: workspace.canvasLayout.nodes,
        contentCanvases: savedContentCanvases.map((c) => ({
          _id: c._id,
          name: c.name,
          description: c.description,
          nodes: c.nodes,
          backgroundColor: c.backgroundColor,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        canvasSize: workspace.canvasLayout.canvasSize,
        backgroundColor: workspace.canvasLayout.backgroundColor,
        gridEnabled: workspace.canvasLayout.gridEnabled,
        gridSize: workspace.canvasLayout.gridSize,
        revision: workspace.canvasLayout.revision,
        lastModifiedBy: workspace.canvasLayout.lastModifiedBy,
        createdAt: workspace.canvasLayout.createdAt,
        updatedAt: workspace.canvasLayout.updatedAt,
      };

      this.logger.info('Canvas layout saved successfully', {
        workspaceId,
        userId,
        revision: newRevision,
        previousRevision: currentRevision,
        nodesCount: nodes.length,
        contentCanvasesCount: contentCanvases?.length ?? 0,
        payloadSize,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        // Re-throw known errors (already logged)
        throw error;
      }
      this.logger.error('Canvas layout save failed - unexpected error', {
        workspaceId,
        userId,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Resets the canvas layout to default empty state
   */
  async resetLayout(workspaceId: string, userId: string) {
    const startTime = Date.now();

    try {
      const workspace = await WorkspaceModel.findById(workspaceId);

      if (!workspace || workspace.userId !== userId) {
        this.logger.warn('Canvas layout reset failed - workspace not found or access denied', {
          workspaceId,
          userId,
          found: !!workspace,
          isOwner: workspace?.userId === userId,
          duration: Date.now() - startTime,
        });
        throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
      }

      // Remove canvas layout and content canvases
      workspace.canvasLayout = undefined;
      await workspace.save();

      await WorkspaceContentCanvasModel.deleteMany({ workspaceId });

      this.logger.info('Canvas layout reset successfully', {
        workspaceId,
        userId,
        duration: Date.now() - startTime,
      });

      return { success: true };
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        // Re-throw known errors
        throw error;
      }
      this.logger.error('Canvas layout reset failed - unexpected error', {
        workspaceId,
        userId,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Gets a specific content canvas by ID
   */
  async getContentCanvas(contentCanvasId: string, userId: string) {
    const startTime = Date.now();

    try {
      const contentCanvas = await WorkspaceContentCanvasModel.findById(contentCanvasId);

      if (!contentCanvas) {
        this.logger.warn('Content canvas retrieval failed - not found', {
          contentCanvasId,
          userId,
          duration: Date.now() - startTime,
        });
        throw ORPCNotFoundError(errorCodes.CANVAS_LAYOUT_NOT_FOUND);
      }

      // Check access: user must own the workspace or it must be public
      const workspace = await WorkspaceModel.findById(contentCanvas.workspaceId);
      if (!workspace) {
        this.logger.warn('Content canvas retrieval failed - parent workspace not found', {
          contentCanvasId,
          workspaceId: contentCanvas.workspaceId,
          userId,
          duration: Date.now() - startTime,
        });
        throw ORPCNotFoundError(errorCodes.CANVAS_LAYOUT_NOT_FOUND);
      }

      if (workspace.userId !== userId && workspace.visibility !== 'PUBLIC') {
        this.logger.warn('Content canvas retrieval failed - access denied', {
          contentCanvasId,
          workspaceId: contentCanvas.workspaceId,
          userId,
          ownerId: workspace.userId,
          visibility: workspace.visibility,
          duration: Date.now() - startTime,
        });
        throw ORPCNotFoundError(errorCodes.CANVAS_LAYOUT_NOT_FOUND);
      }

      const result = {
        _id: contentCanvas._id,
        name: contentCanvas.name,
        description: contentCanvas.description,
        nodes: contentCanvas.nodes,
        backgroundColor: contentCanvas.backgroundColor,
        createdAt: contentCanvas.createdAt,
        updatedAt: contentCanvas.updatedAt,
      };

      this.logger.info('Content canvas retrieved successfully', {
        contentCanvasId,
        workspaceId: contentCanvas.workspaceId,
        userId,
        nodesCount: contentCanvas.nodes.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        // Re-throw known errors
        throw error;
      }
      this.logger.error('Content canvas retrieval failed - unexpected error', {
        contentCanvasId,
        userId,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }
}

export const canvasService = new CanvasService();
