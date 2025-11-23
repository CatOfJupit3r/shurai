import { errorCodes } from '@shurai/shared/enums/errors.enums';

import { ObjectIdString } from '@~/db/helpers';
import { ORPCBadRequestError, ORPCNotFoundError } from '@~/lib/orpc-error-wrapper';

import { WorkspaceContentCanvasModel } from '../db/models/canvas-layout.model';
import type { CanvasNodeClass } from '../db/models/canvas-layout.model';
import { WorkspaceItemModel } from '../db/models/workspace-item.model';
import { WorkspaceModel } from '../db/models/workspace.model';

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
        console.warn(`Canvas layout references non-existent items in workspace ${workspaceId}:`, missingItemIds);
      }
    }
  }

  /**
   * Gets the canvas layout for a workspace
   */
  async getLayout(workspaceId: string, userId: string) {
    const workspace = await WorkspaceModel.findById(workspaceId);

    if (!workspace) {
      throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
    }

    // Check access: user must own the workspace or it must be public
    if (workspace.userId !== userId && workspace.visibility !== 'PUBLIC') {
      throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
    }

    if (!workspace.canvasLayout) {
      throw ORPCNotFoundError(errorCodes.CANVAS_LAYOUT_NOT_FOUND);
    }

    // Fetch associated content canvases
    const contentCanvases = await WorkspaceContentCanvasModel.find({ workspaceId });

    return {
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
  }

  /**
   * Gets the public canvas layout by workspace slug
   */
  async getPublicLayout(slug: string) {
    const workspace = await WorkspaceModel.findOne({ shareableSlug: slug, visibility: 'PUBLIC' });

    if (!workspace) {
      throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
    }

    if (!workspace.canvasLayout) {
      throw ORPCNotFoundError(errorCodes.CANVAS_LAYOUT_NOT_FOUND);
    }

    // Fetch associated content canvases
    const contentCanvases = await WorkspaceContentCanvasModel.find({ workspaceId: workspace._id });

    return {
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
  }

  /**
   * Saves or updates the canvas layout for a workspace
   */
  async saveLayout(input: iSaveLayoutInput, userId: string) {
    const { workspaceId, nodes, contentCanvases, canvasSize, backgroundColor, gridSize } = input;
    const isGridEnabled = input.gridEnabled;

    const workspace = await WorkspaceModel.findById(workspaceId);

    if (!workspace || workspace.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
    }

    // Validate depth limit and references
    this.validateDepthLimit(nodes, contentCanvases);
    await this.validateReferences(workspaceId, nodes, contentCanvases);

    const now = new Date();
    const currentRevision = workspace.canvasLayout?.revision ?? 0;

    // Update or create embedded canvas layout
    workspace.canvasLayout = {
      _id: workspace.canvasLayout?._id ?? ObjectIdString(),
      nodes: nodes as CanvasNodeClass[],
      canvasSize,
      backgroundColor,
      gridEnabled: isGridEnabled,
      gridSize,
      revision: currentRevision + 1,
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

    return {
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
  }

  /**
   * Resets the canvas layout to default empty state
   */
  async resetLayout(workspaceId: string, userId: string) {
    const workspace = await WorkspaceModel.findById(workspaceId);

    if (!workspace || workspace.userId !== userId) {
      throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
    }

    // Remove canvas layout and content canvases
    workspace.canvasLayout = undefined;
    await workspace.save();

    await WorkspaceContentCanvasModel.deleteMany({ workspaceId });

    return { success: true };
  }

  /**
   * Gets a specific content canvas by ID
   */
  async getContentCanvas(contentCanvasId: string, userId: string) {
    const contentCanvas = await WorkspaceContentCanvasModel.findById(contentCanvasId);

    if (!contentCanvas) {
      throw ORPCNotFoundError(errorCodes.CANVAS_LAYOUT_NOT_FOUND);
    }

    // Check access: user must own the workspace or it must be public
    const workspace = await WorkspaceModel.findById(contentCanvas.workspaceId);
    if (!workspace) {
      throw ORPCNotFoundError(errorCodes.CANVAS_LAYOUT_NOT_FOUND);
    }

    if (workspace.userId !== userId && workspace.visibility !== 'PUBLIC') {
      throw ORPCNotFoundError(errorCodes.CANVAS_LAYOUT_NOT_FOUND);
    }

    return {
      _id: contentCanvas._id,
      name: contentCanvas.name,
      description: contentCanvas.description,
      nodes: contentCanvas.nodes,
      backgroundColor: contentCanvas.backgroundColor,
      createdAt: contentCanvas.createdAt,
      updatedAt: contentCanvas.updatedAt,
    };
  }
}

export const canvasService = new CanvasService();
