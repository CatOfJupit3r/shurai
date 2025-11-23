/**
 * Canvas History Hook
 * Manages undo/redo functionality for canvas changes
 */
import { useRef, useState } from 'react';

import useStableCallback from '@~/hooks/use-stable-callback';

import type { iCanvasNodeData } from '../components/canvas-node';

interface iHistoryState {
  nodes: iCanvasNodeData[];
  timestamp: number;
}

interface iUseCanvasHistoryOptions {
  maxHistorySize?: number;
}

export function useCanvasHistory({ maxHistorySize = 50 }: iUseCanvasHistoryOptions = {}) {
  const [history, setHistory] = useState<iHistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isUndoingRef = useRef(false);

  const pushState = useStableCallback((nodes: iCanvasNodeData[]) => {
    // Don't push if we're in the middle of an undo operation
    if (isUndoingRef.current) {
      return;
    }

    setHistory((prev) => {
      // Remove any states after current index (for redo after new changes)
      const newHistory = prev.slice(0, currentIndex + 1);

      // Add new state
      const newState: iHistoryState = {
        nodes: JSON.parse(JSON.stringify(nodes)), // Deep clone
        timestamp: Date.now(),
      };

      newHistory.push(newState);

      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        return newHistory;
      }

      return newHistory;
    });

    setCurrentIndex((prev) => {
      const newIndex = Math.min(prev + 1, maxHistorySize - 1);
      return newIndex;
    });
  });

  const undo = useStableCallback(() => {
    if (currentIndex <= 0) {
      return null;
    }

    isUndoingRef.current = true;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);

    // Return the previous state
    const previousState = history[newIndex];

    // Reset the flag after a short delay
    setTimeout(() => {
      isUndoingRef.current = false;
    }, 100);

    return previousState ? previousState.nodes : null;
  });

  const redo = useStableCallback(() => {
    if (currentIndex >= history.length - 1) {
      return null;
    }

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);

    // Return the next state
    const nextState = history[newIndex];
    return nextState ? nextState.nodes : null;
  });

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const clear = useStableCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  });

  const reset = useStableCallback((nodes: iCanvasNodeData[]) => {
    setHistory([
      {
        nodes: JSON.parse(JSON.stringify(nodes)),
        timestamp: Date.now(),
      },
    ]);
    setCurrentIndex(0);
  });

  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
    reset,
    historySize: history.length,
    currentIndex,
  };
}
