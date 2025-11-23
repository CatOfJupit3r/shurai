import { createFileRoute } from '@tanstack/react-router';
import { useAtom } from 'jotai';
import { useState, useEffect, useCallback } from 'react';
import {
  FiChevronLeft,
  FiGrid,
  FiSave,
  FiList,
  FiHelpCircle,
  FiRotateCcw,
  FiInfo,
  FiX,
  FiPlus,
  FiImage,
  FiBox,
} from 'react-icons/fi';
import { HiOutlineCube } from 'react-icons/hi';
import { toast } from 'react-toastify';

import { tryCatch } from '@shurai/shared/helpers/std-utils';

import { Alert, AlertDescription, AlertTitle } from '@~/components/ui/alert';
import { Button } from '@~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@~/components/ui/dropdown-menu';
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
  CanvasNodesList,
  KeyboardShortcutsModal,
  useCanvasKeyboard,
  useCanvasHistory,
  scaleAtom,
  stagePositionAtom,
} from '@~/features/canvas';
import type { iCanvasNodeData } from '@~/features/canvas';
import { useWorkspace, useItemHierarchy } from '@~/features/workspaces';
import useStableCallback from '@~/hooks/use-stable-callback';

export const Route = createFileRoute('/_auth_only/workspaces/$workspaceId/canvas')({
  component: RouteComponent,
  ssr: 'data-only',
  beforeLoad: async ({ context, params }) => {
    // Try to fetch the layout, but don't fail if it doesn't exist yet - that's okay, it will be created when needed
    // Just ignore the error and let the component handle it
    await tryCatch(async () =>
      context.queryClient.ensureQueryData(
        context.tanstackRPC.canvas.getLayout.queryOptions({
          input: { workspaceId: params.workspaceId },
        }),
      ),
    );
  },
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

function EmptyCanvas() {
  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HiOutlineCube className="size-10" />
        </EmptyMedia>
        <EmptyTitle>Canvas is being set up...</EmptyTitle>
        <EmptyDescription>
          Creating an empty canvas for your workspace.
          <br />
          You can position, resize, and rotate items on the canvas.
          <br />
          <br />
          <span className="text-xs">
            <strong>Note:</strong> Canvas supports selecting existing assets only. Content canvases have single-level
            depth.
          </span>
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function RouteComponent() {
  const { workspaceId } = Route.useParams();
  const navigate = Route.useNavigate();

  const { workspace, isPending: isLoadingWorkspace, error: workspaceError } = useWorkspace(workspaceId);
  const { layout, isPending: isLoadingLayout, error: layoutError } = useCanvasLayout(workspaceId);
  const { items } = useItemHierarchy(workspaceId);
  const { saveLayout, isPending: isSaving } = useSaveCanvasLayout();

  // Canvas view state
  const [, setScale] = useAtom(scaleAtom);
  const [, setStagePosition] = useAtom(stagePositionAtom);

  const [nodes, setNodes] = useState<iCanvasNodeData[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isGridEnabled, setIsGridEnabled] = useState(true);
  const canvasSize = { width: 1440, height: 810 };
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sub-canvas modal state
  const [isSubCanvasOpen, setIsSubCanvasOpen] = useState(false);
  const [selectedSubCanvasId, setSelectedSubCanvasId] = useState<string | null>(null);
  const [selectedSubCanvasParentName, setSelectedSubCanvasParentName] = useState<string>('');

  // Accessibility state
  const [isNodesListOpen, setIsNodesListOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Info banner state
  const [isInfoBannerDismissed, setIsInfoBannerDismissed] = useState(() => {
    // Check localStorage for dismissed state
    const dismissed = localStorage.getItem(`canvas-info-banner-dismissed-${workspaceId}`);
    return dismissed === 'true';
  });

  // History management
  const history = useCanvasHistory({ maxHistorySize: 50 });

  // Sync nodes from fetched layout
  useEffect(() => {
    if (layout?.nodes) {
      setNodes(layout.nodes as iCanvasNodeData[]);
      setIsGridEnabled(layout.gridEnabled ?? true);
      // Initialize history with loaded state
      history.reset(layout.nodes as iCanvasNodeData[]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  // Auto-create canvas layout if it doesn't exist
  useEffect(() => {
    if (!isLoadingLayout && !layout && !layoutError && !isSaving) {
      const defaultLayout = {
        workspaceId,
        nodes: [],
        canvasSize,
        gridEnabled: true,
        gridSize: 20,
      };

      saveLayout(defaultLayout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingLayout, layout, layoutError]);

  const handleBack = useStableCallback(() => {
    if (hasUnsavedChanges) {
      // eslint-disable-next-line no-alert
      const hasConfirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!hasConfirmed) return;
    }
    void navigate({ to: '/workspaces/$workspaceId/builder', params: { workspaceId } });
  });

  const handleSave = useStableCallback(() => {
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
  });

  const handleNodeClick = useStableCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setIsInspectorOpen(true);
  });

  const handleNodeDoubleClick = useStableCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node?.type === 'SUB_CANVAS' && node.subCanvasId) {
      // Find the content canvas name from layout
      const contentCanvas = layout?.contentCanvases?.find((c) => c._id === node.subCanvasId);
      setSelectedSubCanvasId(node.subCanvasId);
      setSelectedSubCanvasParentName(contentCanvas?.name ?? 'Content Canvas');
      setIsSubCanvasOpen(true);
    }
  });

  const handleNodeDragEnd = useStableCallback((nodeId: string, newPosition: { x: number; y: number }) => {
    setNodes((prev) => {
      const updated = prev.map((node) => (node.id === nodeId ? { ...node, position: newPosition } : node));
      // Push to history
      history.pushState(updated);
      return updated;
    });
    setHasUnsavedChanges(true);
  });

  const handleNodeTransform = useStableCallback(
    (nodeId: string, newProps: { x: number; y: number; width: number; height: number; rotation: number }) => {
      setNodes((prev) => {
        const updated = prev.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                position: { x: newProps.x, y: newProps.y },
                size: { width: newProps.width, height: newProps.height },
                rotation: newProps.rotation,
              }
            : node,
        );
        // Push to history
        history.pushState(updated);
        return updated;
      });
      setHasUnsavedChanges(true);
    },
  );

  const handleNodeUpdate = useStableCallback((nodeId: string, updates: Partial<iCanvasNodeData>) => {
    setNodes((prev) => {
      const updated = prev.map((node) => (node.id === nodeId ? { ...node, ...updates } : node));
      // Push to history
      history.pushState(updated);
      return updated;
    });
    setHasUnsavedChanges(true);
  });

  const handleNodeDelete = useStableCallback((nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setNodes((prev) => {
      const updated = prev.filter((n) => n.id !== nodeId);
      history.pushState(updated);
      return updated;
    });
    setHasUnsavedChanges(true);
    setSelectedNodeId(null);
    setIsInspectorOpen(false);
    toast.success(`${node.type} node removed from canvas`);
  });

  const handleUndo = useStableCallback(() => {
    const previousState = history.undo();
    if (previousState) {
      setNodes(previousState);
      setHasUnsavedChanges(true);
      toast.success('Last change has been reverted');
    } else {
      toast.info('Nothing to undo');
    }
  });

  const handleResetSize = useStableCallback((nodeId: string) => {
    const defaultSize = { width: 200, height: 200 };
    handleNodeUpdate(nodeId, { size: defaultSize });
    toast.success('Node size restored to default');
  });

  const handleResetToSaved = useStableCallback(() => {
    if (!layout?.nodes) return;

    setNodes(layout.nodes as iCanvasNodeData[]);
    setHasUnsavedChanges(false);
    history.reset(layout.nodes as iCanvasNodeData[]);
    toast.success('All changes have been discarded');
  });

  const handleResetZoom = useStableCallback(() => {
    setScale(1);
    setStagePosition({ x: 0, y: 0 });
    toast.success('Canvas view reset');
  });
  // Keyboard shortcuts hook
  useCanvasKeyboard({
    selectedNodeId,
    nodes,
    onNodeUpdate: handleNodeUpdate,
    onNodeDelete: handleNodeDelete,
    onUndo: handleUndo,
    onResetSize: handleResetSize,
    onDeselect: () => {
      setSelectedNodeId(null);
    },
    isEnabled: !isShortcutsModalOpen && !isSubCanvasOpen,
  });

  const handleStageClick = useStableCallback(() => {
    setSelectedNodeId(null);
  });

  const handleCloseSubCanvas = useStableCallback(() => {
    setIsSubCanvasOpen(false);
    setSelectedSubCanvasId(null);
    setSelectedSubCanvasParentName('');
  });

  const handleDismissInfoBanner = useStableCallback(() => {
    setIsInfoBannerDismissed(true);
    localStorage.setItem(`canvas-info-banner-dismissed-${workspaceId}`, 'true');
  });

  const handleAddNode = useStableCallback(
    useCallback(
      (type: 'ITEM' | 'ASSET' | 'SUB_CANVAS') => {
        const newNode: iCanvasNodeData = {
          id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          position: { x: 100, y: 100 },
          size: { width: 200, height: 200 },
          zIndex: nodes.length,
        };

        setNodes((prev) => {
          const updated = [...prev, newNode];
          history.pushState(updated);
          return updated;
        });
        setHasUnsavedChanges(true);
        toast.success(`New ${type} node created`);
      },
      [nodes.length, history],
    ),
  );

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
    <div className="h-full max-h-[calc(100vh-2rem)] max-w-screen overflow-hidden bg-background">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" title="Add a new node to the canvas" aria-label="Add new node">
                  <FiPlus />
                  Add Node
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    handleAddNode('ITEM');
                  }}
                >
                  <FiBox className="mr-2 size-4" />
                  <span>Item Node</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleAddNode('ASSET');
                  }}
                >
                  <FiImage className="mr-2 size-4" />
                  <span>Asset Node</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleAddNode('SUB_CANVAS');
                  }}
                >
                  <HiOutlineCube className="mr-2 size-4" />
                  <span>Sub Canvas Node</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsNodesListOpen(!isNodesListOpen)}
              title="Toggle nodes list"
              aria-label="Toggle nodes list panel"
            >
              <FiList />
              Nodes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsShortcutsModalOpen(true)}
              title="View keyboard shortcuts"
              aria-label="View keyboard shortcuts"
            >
              <FiHelpCircle />
              Shortcuts
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetZoom}
              title="Reset canvas zoom and pan"
              aria-label="Reset canvas view"
            >
              <FiRotateCcw />
              Reset View
            </Button>
            {hasUnsavedChanges ? (
              <Button variant="ghost" size="sm" onClick={handleResetToSaved} title="Reset to last saved state">
                <FiRotateCcw />
                Reset
              </Button>
            ) : null}
            <div className="mx-2 h-6 w-px bg-border" />
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

      {/* Canvas Limitations Info Banner */}
      {!isInfoBannerDismissed && layout && !layoutError ? (
        <div className="absolute inset-x-0 top-[69px] z-10 border-b border-border bg-card px-6 py-3">
          <Alert>
            <FiInfo className="text-blue-500" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <AlertTitle>Canvas Limitations</AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>
                      • Assets can only be selected from your existing library (uploads are not supported in canvas)
                    </li>
                    <li>• Content canvases are limited to a single level of depth (no nested content canvases)</li>
                    <li>• Content canvas nodes (SUB_CANVAS) cannot be resized, only repositioned</li>
                  </ul>
                </AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={handleDismissInfoBanner}
                aria-label="Dismiss canvas limitations banner"
              >
                <FiX />
              </Button>
            </div>
          </Alert>
        </div>
      ) : null}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Nodes List Sidebar */}
        {isNodesListOpen ? (
          <div className="w-80 border-r border-border bg-card">
            <div className="border-b border-border p-4">
              <h2 className="text-lg font-semibold">Canvas Nodes</h2>
              <p className="text-xs text-muted-foreground">
                {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'} • Use arrow keys to navigate
              </p>
            </div>
            <CanvasNodesList
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={(nodeId) => {
                setSelectedNodeId(nodeId);
                setIsInspectorOpen(true);
              }}
              onDeleteNode={handleNodeDelete}
              className="h-[calc(100%-73px)]"
            />
          </div>
        ) : null}

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-muted/20 p-4">
          {layoutError || !layout ? (
            <EmptyCanvas />
          ) : (
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
                      onNodeDoubleClick={handleNodeDoubleClick}
                      onNodeDragEnd={handleNodeDragEnd}
                      onNodeTransform={handleNodeTransform}
                      items={items || []}
                    />
                  ))}
              </CanvasStage>
            </div>
          )}
        </div>

        {/* Inspector Panel */}
        {isInspectorOpen ? (
          <InspectorPanel
            node={selectedNode}
            onClose={() => {
              setIsInspectorOpen(false);
              setSelectedNodeId(null);
            }}
            onUpdate={handleNodeUpdate}
            items={items || []}
          />
        ) : null}
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setIsShortcutsModalOpen(false)} />

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
