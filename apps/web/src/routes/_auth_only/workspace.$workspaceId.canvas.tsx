import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useEffect } from 'react';
import { FiChevronLeft, FiGrid, FiSave, FiMaximize2 } from 'react-icons/fi';
import { HiOutlineCube } from 'react-icons/hi';
import { toast } from 'react-toastify';

import { Button } from '@~/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@~/components/ui/empty';
import { Label } from '@~/components/ui/label';
import { Skeleton } from '@~/components/ui/skeleton';
import { Switch } from '@~/components/ui/switch';
import {
  useCanvasLayout,
  useSaveCanvasLayout,
  CanvasStage,
  CanvasNode,
  GridOverlay,
  InspectorPanel,
  SubCanvasModal,
} from '@~/features/canvas';
import type { iCanvasNodeData } from '@~/features/canvas';
import { useWorkspace } from '@~/features/workspaces';

export const Route = createFileRoute('/_auth_only/workspace/$workspaceId/canvas')({
  component: RouteComponent,
});

function CanvasSkeleton() {
  return (
    <div className="flex h-[calc(100vh-64px)] gap-4">
      <div className="flex-1 p-6">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  );
}

function EmptyCanvas({ onCreateLayout }: { onCreateLayout: () => unknown }) {
  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HiOutlineCube className="size-10" />
        </EmptyMedia>
        <EmptyTitle>No canvas layout yet</EmptyTitle>
        <EmptyDescription>
          Create a canvas layout to visually arrange and present your workspace items.
          <br />
          You can position, resize, and rotate items on the canvas.
        </EmptyDescription>
      </EmptyHeader>
      <Button size="lg" onClick={onCreateLayout}>
        <FiMaximize2 />
        Create Canvas Layout
      </Button>
    </Empty>
  );
}

function RouteComponent() {
  const { workspaceId } = Route.useParams();
  const navigate = Route.useNavigate();

  const { workspace, isPending: isLoadingWorkspace, error: workspaceError } = useWorkspace(workspaceId);
  const { layout, isPending: isLoadingLayout, error: layoutError, refetch } = useCanvasLayout(workspaceId);
  const { saveLayout, isPending: isSaving } = useSaveCanvasLayout();

  const [nodes, setNodes] = useState<iCanvasNodeData[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isGridEnabled, setIsGridEnabled] = useState(true);
  const canvasSize = { width: 1920, height: 1080 };
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sub-canvas modal state
  const [isSubCanvasOpen, setIsSubCanvasOpen] = useState(false);
  const [selectedSubCanvasId, setSelectedSubCanvasId] = useState<string | null>(null);
  const [selectedSubCanvasParentName, setSelectedSubCanvasParentName] = useState<string>('');

  // Sync nodes from fetched layout
  useEffect(() => {
    if (layout?.nodes) {
      setNodes(layout.nodes as iCanvasNodeData[]);
      setIsGridEnabled(layout.gridEnabled ?? true);
    }
  }, [layout]);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      // eslint-disable-next-line no-alert
      const hasConfirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!hasConfirmed) return;
    }
    void navigate({ to: '/workspace/$workspaceId/builder', params: { workspaceId } });
  };

  const handleCreateLayout = () => {
    const defaultLayout = {
      workspaceId,
      nodes: [],
      canvasSize,
      gridEnabled: true,
      gridSize: 20,
    };

    saveLayout(defaultLayout, {
      onSuccess: () => {
        void refetch();
        toast.success('Canvas layout created');
      },
    });
  };

  const handleSave = () => {
    if (!layout) return;

    saveLayout(
      {
        workspaceId,
        nodes,
        contentCanvases: layout.contentCanvases,
        canvasSize: layout.canvasSize,
        backgroundColor: layout.backgroundColor,
        gridEnabled: isGridEnabled,
        gridSize: layout.gridSize ?? 20,
      },
      {
        onSuccess: () => {
          setHasUnsavedChanges(false);
        },
      },
    );
  };

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setIsInspectorOpen(true);
  }, []);

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node?.type === 'SUB_CANVAS' && node.subCanvasId) {
        // Find the content canvas name from layout
        const contentCanvas = layout?.contentCanvases?.find((c) => c._id === node.subCanvasId);
        setSelectedSubCanvasId(node.subCanvasId);
        setSelectedSubCanvasParentName(contentCanvas?.name ?? 'Content Canvas');
        setIsSubCanvasOpen(true);
      }
    },
    [nodes, layout],
  );

  const handleNodeDragEnd = useCallback((nodeId: string, newPosition: { x: number; y: number }) => {
    setNodes((prev) => prev.map((node) => (node.id === nodeId ? { ...node, position: newPosition } : node)));
    setHasUnsavedChanges(true);
  }, []);

  const handleNodeTransform = useCallback(
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
    [],
  );

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<iCanvasNodeData>) => {
    setNodes((prev) => prev.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)));
    setHasUnsavedChanges(true);
  }, []);

  const handleStageClick = useCallback(() => {
    setSelectedNodeId(null);
    setIsInspectorOpen(false);
  }, []);

  const handleCloseSubCanvas = useCallback(() => {
    setIsSubCanvasOpen(false);
    setSelectedSubCanvasId(null);
    setSelectedSubCanvasParentName('');
  }, []);

  if (isLoadingWorkspace || isLoadingLayout) {
    return (
      <div className="min-h-screen bg-background">
        <CanvasSkeleton />
      </div>
    );
  }

  if (workspaceError || !workspace) {
    return (
      <div className="min-h-screen bg-background">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Failed to load workspace</EmptyTitle>
            <EmptyDescription>There was an error loading the workspace. Please try again later.</EmptyDescription>
          </EmptyHeader>
          <Button onClick={handleBack}>
            <FiChevronLeft />
            Back to Builder
          </Button>
        </Empty>
      </div>
    );
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <FiChevronLeft />
              Back to Builder
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{workspace.title} - Canvas</h1>
              <p className="text-sm text-muted-foreground">
                {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}
                {hasUnsavedChanges ? ' • Unsaved changes' : null}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-4 flex items-center gap-2">
              <Switch id="grid-toggle" checked={isGridEnabled} onCheckedChange={setIsGridEnabled} />
              <Label htmlFor="grid-toggle" className="cursor-pointer text-sm">
                <FiGrid className="mr-1 inline" />
                Grid
              </Label>
            </div>
            <Button onClick={handleSave} disabled={!hasUnsavedChanges || isSaving}>
              <FiSave />
              {isSaving ? 'Saving...' : 'Save Layout'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden bg-muted/20 p-6">
          {layoutError || !layout ? (
            <EmptyCanvas onCreateLayout={handleCreateLayout} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <CanvasStage width={canvasSize.width} height={canvasSize.height} onStageClick={handleStageClick}>
                <GridOverlay width={canvasSize.width} height={canvasSize.height} />
                {nodes.map((node) => (
                  <CanvasNode
                    key={node.id}
                    node={node}
                    onNodeClick={handleNodeClick}
                    onNodeDoubleClick={handleNodeDoubleClick}
                    onNodeDragEnd={handleNodeDragEnd}
                    onNodeTransform={handleNodeTransform}
                  />
                ))}
              </CanvasStage>
            </div>
          )}
        </div>

        {/* Inspector Panel */}
        {isInspectorOpen && selectedNode ? (
          <InspectorPanel
            node={selectedNode}
            onClose={() => {
              setIsInspectorOpen(false);
              setSelectedNodeId(null);
            }}
            onUpdate={handleNodeUpdate}
          />
        ) : null}
      </div>

      {/* Sub-Canvas Modal */}
      <SubCanvasModal
        isOpen={isSubCanvasOpen}
        onClose={handleCloseSubCanvas}
        contentCanvasId={selectedSubCanvasId}
        parentItemName={selectedSubCanvasParentName}
      />
    </div>
  );
}
