import { useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';

import { isDirtyAtom, lastSavedContentCanvasesAtom, lastSavedNodesAtom } from '../store/canvas-atoms';
import type { iCanvasNode, iContentCanvas } from '../store/canvas-atoms';
import { useResetCanvasLayout } from './use-reset-canvas-layout';
import { useSaveCanvasLayout } from './use-save-canvas-layout';

interface iUseCanvasDirtyStateOptions {
  workspaceId: string;
  currentNodes: iCanvasNode[];
  currentContentCanvases?: iContentCanvas[];
  canvasSize: { width: number; height: number };
  backgroundColor?: string;
  gridEnabled?: boolean;
  gridSize?: number;
}

interface iUseCanvasDirtyStateReturn {
  isDirty: boolean;
  save: () => void;
  reset: () => void;
  markClean: () => void;
  markDirty: () => void;
  isSaving: boolean;
  isResetting: boolean;
}

/**
 * Hook for managing canvas dirty state and providing save/reset actions
 * Tracks whether the canvas has unsaved changes compared to the last saved state
 */
export function useCanvasDirtyState({
  workspaceId,
  currentNodes,
  currentContentCanvases,
  canvasSize,
  backgroundColor,
  gridEnabled,
  gridSize,
}: iUseCanvasDirtyStateOptions): iUseCanvasDirtyStateReturn {
  const [isDirty, setIsDirty] = useAtom(isDirtyAtom);
  const [lastSavedNodes, setLastSavedNodes] = useAtom(lastSavedNodesAtom);
  const [lastSavedContentCanvases, setLastSavedContentCanvases] = useAtom(lastSavedContentCanvasesAtom);

  const { saveLayout, isPending: isSaving } = useSaveCanvasLayout();
  const { resetLayout, isPending: isResetting } = useResetCanvasLayout();

  // Compare current state with last saved state
  useEffect(() => {
    const hasNodesChanged = JSON.stringify(currentNodes) !== JSON.stringify(lastSavedNodes);
    const hasContentCanvasesChanged =
      JSON.stringify(currentContentCanvases ?? []) !== JSON.stringify(lastSavedContentCanvases);

    if (hasNodesChanged || hasContentCanvasesChanged) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [currentNodes, currentContentCanvases, lastSavedNodes, lastSavedContentCanvases, setIsDirty]);

  const save = useCallback(() => {
    saveLayout(
      {
        workspaceId,
        nodes: currentNodes,
        contentCanvases: currentContentCanvases,
        canvasSize,
        backgroundColor,
        gridEnabled,
        gridSize,
      },
      {
        onSuccess: () => {
          // Update last saved state on successful save
          setLastSavedNodes(currentNodes);
          setLastSavedContentCanvases(currentContentCanvases ?? []);
          setIsDirty(false);
        },
      },
    );
  }, [
    saveLayout,
    workspaceId,
    currentNodes,
    currentContentCanvases,
    canvasSize,
    backgroundColor,
    gridEnabled,
    gridSize,
    setLastSavedNodes,
    setLastSavedContentCanvases,
    setIsDirty,
  ]);

  const reset = useCallback(() => {
    resetLayout(
      { workspaceId },
      {
        onSuccess: () => {
          // Clear last saved state on successful reset
          setLastSavedNodes([]);
          setLastSavedContentCanvases([]);
          setIsDirty(false);
        },
      },
    );
  }, [resetLayout, workspaceId, setLastSavedNodes, setLastSavedContentCanvases, setIsDirty]);

  const markClean = useCallback(() => {
    setLastSavedNodes(currentNodes);
    setLastSavedContentCanvases(currentContentCanvases ?? []);
    setIsDirty(false);
  }, [currentNodes, currentContentCanvases, setLastSavedNodes, setLastSavedContentCanvases, setIsDirty]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, [setIsDirty]);

  return {
    isDirty,
    save,
    reset,
    markClean,
    markDirty,
    isSaving,
    isResetting,
  };
}
