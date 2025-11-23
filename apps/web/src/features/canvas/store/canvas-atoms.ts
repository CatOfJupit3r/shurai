/**
 * Canvas state management using Jotai atoms
 */
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import type { CanvasNodeType } from '@shurai/shared';

// Type definitions for canvas state
export interface iCanvasNode {
  id: string;
  type: CanvasNodeType;
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

export interface iCanvasState {
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  isDragging: boolean;
  isResizing: boolean;
  isRotating: boolean;
  scale: number;
  stagePosition: { x: number; y: number };
  gridEnabled: boolean;
  gridSize: number;
  showGuides: boolean;
}

// Selected node atom
export const selectedNodeIdAtom = atom<string | null>(null);

// Hovered node atom
export const hoveredNodeIdAtom = atom<string | null>(null);

// Interaction state atoms
export const isDraggingAtom = atom<boolean>(false);
export const isResizingAtom = atom<boolean>(false);
export const isRotatingAtom = atom<boolean>(false);

// Canvas view state
export const scaleAtom = atom<number>(1);
export const stagePositionAtom = atom<{ x: number; y: number }>({
  x: 0,
  y: 0,
});

// Grid state
export const gridEnabledAtom = atomWithStorage<boolean>('canvas-grid-enabled', true);
export const gridSizeAtom = atomWithStorage<number>('canvas-grid-size', 20);
export const showGuidesAtom = atomWithStorage<boolean>('canvas-guides-enabled', true);

// Derived atoms
export const isTransformingAtom = atom((get) => get(isDraggingAtom) || get(isResizingAtom) || get(isRotatingAtom));

// Canvas state combined atom
export const canvasStateAtom = atom<iCanvasState>((get) => ({
  selectedNodeId: get(selectedNodeIdAtom),
  hoveredNodeId: get(hoveredNodeIdAtom),
  isDragging: get(isDraggingAtom),
  isResizing: get(isResizingAtom),
  isRotating: get(isRotatingAtom),
  scale: get(scaleAtom),
  stagePosition: get(stagePositionAtom),
  gridEnabled: get(gridEnabledAtom),
  gridSize: get(gridSizeAtom),
  showGuides: get(showGuidesAtom),
}));

// Dirty state tracking for unsaved changes
export const isDirtyAtom = atom<boolean>(false);

// Snapshot of last saved state for comparison
export const lastSavedNodesAtom = atom<iCanvasNode[]>([]);

// Content canvas interface
export interface iContentCanvas {
  _id: string;
  name: string;
  description?: string;
  nodes: iCanvasNode[];
  backgroundColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Snapshot of last saved content canvases
export const lastSavedContentCanvasesAtom = atom<iContentCanvas[]>([]);
