import { useAtom } from 'jotai';
import { isEqual } from 'lodash-es';
import { useEffect } from 'react';

import useStableCallback from '@~/hooks/use-stable-callback';

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
    const hasNodesChanged = !isEqual(currentNodes, lastSavedNodes);
    const hasContentCanvasesChanged = !isEqual(currentContentCanvases ?? [], lastSavedContentCanvases);

    if (hasNodesChanged || hasContentCanvasesChanged) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [currentNodes, currentContentCanvases, lastSavedNodes, lastSavedContentCanvases, setIsDirty]);

  const save = useStableCallback(() => {
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
  });

  const reset = useStableCallback(() => {
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
  });

  const markClean = useStableCallback(() => {
    setLastSavedNodes(currentNodes);
    setLastSavedContentCanvases(currentContentCanvases ?? []);
    setIsDirty(false);
  });

  const markDirty = useStableCallback(() => {
    setIsDirty(true);
  });

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
