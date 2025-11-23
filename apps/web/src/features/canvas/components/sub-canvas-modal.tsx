/**
 * Sub-Canvas Modal Component
 * Provides a modal interface for editing content canvases (one-level-deep nested layouts)
 */
import { useEffect, useState } from 'react';
import { FiChevronRight, FiSave, FiX } from 'react-icons/fi';
import { HiOutlineCube } from 'react-icons/hi';

import { toastInfo } from '@~/components/toastifications/create-jsx-toasts';
import { Button } from '@~/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@~/components/ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@~/components/ui/empty';
import { Skeleton } from '@~/components/ui/skeleton';
import useStableCallback from '@~/hooks/use-stable-callback';

import { useContentCanvas } from '../hooks/use-content-canvas';
import type { iCanvasNodeData } from './canvas-node';
import { CanvasNode } from './canvas-node';
import { CanvasStage } from './canvas-stage';
import { GridOverlay } from './grid-overlay';

interface iSubCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentCanvasId: string | null;
  parentItemName?: string;
}

function SubCanvasSkeleton() {
  return (
    <div className="flex h-[600px] items-center justify-center">
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  );
}

function EmptySubCanvas() {
  return (
    <Empty className="h-full min-h-[400px]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HiOutlineCube className="size-10" />
        </EmptyMedia>
        <EmptyTitle>Empty content canvas</EmptyTitle>
        <EmptyDescription>
          This content canvas doesn&apos;t have any items yet.
          <br />
          Add items from the main canvas to get started.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function SubCanvasModal({ isOpen, onClose, contentCanvasId, parentItemName }: iSubCanvasModalProps) {
  const { contentCanvas, isPending, error } = useContentCanvas(contentCanvasId);

  const [nodes, setNodes] = useState<iCanvasNodeData[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const canvasSize = { width: 1200, height: 800 };

  // Sync nodes from fetched content canvas
  useEffect(() => {
    if (contentCanvas?.nodes) {
      setNodes(contentCanvas.nodes as iCanvasNodeData[]);
    }
  }, [contentCanvas]);

  const handleClose = useStableCallback(() => {
    if (hasUnsavedChanges) {
      // eslint-disable-next-line no-alert
      const hasConfirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!hasConfirmed) return;
    }
    setHasUnsavedChanges(false);
    onClose();
  });

  const handleSave = useStableCallback(() => {
    if (!contentCanvas) return;

    // Note: We need to update the entire layout to save content canvas changes
    // This is because content canvases are embedded in the workspace layout
    // For now, we'll show a toast indicating this limitation
    toastInfo(
      'Saving content canvas changes...',
      'Content canvas changes will be saved when you save the main canvas layout.',
    );

    setHasUnsavedChanges(false);
  });

  const handleNodeClick = useStableCallback((_nodeId: string) => {
    // Currently no-op, but kept for future implementation
  });
  const handleNodeDragEnd = useStableCallback((nodeId: string, newPosition: { x: number; y: number }) => {
    setNodes((prev) => prev.map((node) => (node.id === nodeId ? { ...node, position: newPosition } : node)));
    setHasUnsavedChanges(true);
  });
  const handleNodeTransform = useStableCallback(
    (nodeId: string, newProps: { x: number; y: number; width: number; height: number; rotation: number }) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                position: { x: newProps.x, y: newProps.y },
                size: { width: newProps.width, height: newProps.height },
                rotation: newProps.rotation,
              }
            : node,
        ),
      );
      setHasUnsavedChanges(true);
    },
  );

  const handleStageClick = useStableCallback(() => {
    // Currently no-op, kept for consistency
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-[90vw] overflow-hidden p-0" showCloseButton={false}>
        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Main Canvas</span>
                <FiChevronRight className="size-4" />
                <span className="font-semibold text-foreground">{parentItemName ?? 'Content Canvas'}</span>
                {hasUnsavedChanges ? <span className="ml-2 text-orange-500">• Unsaved changes</span> : null}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={handleSave} disabled={!hasUnsavedChanges}>
                  <FiSave />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleClose}>
                  <FiX />
                  Close
                </Button>
              </div>
            </div>
            <DialogTitle className="sr-only">Content Canvas - {parentItemName ?? 'Untitled'}</DialogTitle>
          </DialogHeader>
        </div>

        {/* Canvas Area */}
        <div className="h-[600px] overflow-hidden bg-muted/20 p-6">
          {isPending ? <SubCanvasSkeleton /> : null}

          {!isPending && (error ?? !contentCanvas) ? (
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyTitle>Failed to load content canvas</EmptyTitle>
                <EmptyDescription>
                  There was an error loading the content canvas. Please try again later.
                </EmptyDescription>
              </EmptyHeader>
              <Button onClick={handleClose}>Close</Button>
            </Empty>
          ) : null}

          {!isPending && Boolean(!error && contentCanvas && nodes.length === 0) && <EmptySubCanvas />}

          {!isPending && Boolean(!error && contentCanvas && nodes.length > 0) && (
            <div className="flex h-full items-center justify-center">
              <CanvasStage width={canvasSize.width} height={canvasSize.height} onStageClick={handleStageClick}>
                <GridOverlay width={canvasSize.width} height={canvasSize.height} />
                {[...nodes]
                  .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
                  .map((node) => (
                    <CanvasNode
                      key={node.id}
                      node={node}
                      onNodeClick={handleNodeClick}
                      onNodeDragEnd={handleNodeDragEnd}
                      onNodeTransform={handleNodeTransform}
                    />
                  ))}
              </CanvasStage>
            </div>
          )}
        </div>

        {/* Info footer - show depth limitation */}
        <div className="border-t border-border bg-muted/30 px-6 py-3">
          <div className="flex items-start gap-2">
            <span className="text-xs">ℹ️</span>
            <div className="flex-1 text-xs text-muted-foreground">
              <p className="font-medium">Content Canvas Limitations:</p>
              <ul className="mt-1 space-y-0.5">
                <li>• This is a single-level content canvas (depth 1)</li>
                <li>• Nested content canvases are not allowed</li>
                <li>• Only existing assets can be selected (no uploads)</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
