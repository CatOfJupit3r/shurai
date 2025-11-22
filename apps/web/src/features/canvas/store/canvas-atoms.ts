/**
 * Canvas state management using Jotai atoms
 *
 * NOTE: This file requires the following packages to be installed:
 * - jotai@^2.15.1
 *
 * To install: run `bun install` after adding to package.json
 */

// Temporarily using type-only imports until jotai is installed
// import { atom } from 'jotai';
// import { atomWithStorage } from 'jotai/utils';

// Type definitions for canvas state
export interface iCanvasNode {
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

// Placeholder for jotai atoms - will be uncommented once jotai is installed
/*
// Selected node atom
export const selectedNodeIdAtom = atom<string | null>(null);

// Hovered node atom
export const hoveredNodeIdAtom = atom<string | null>(null);

// Interaction state atoms
export const isDraggingAtom = atom<boolean>(false);
export const isResizingAtom = atom<boolean>(false);
export const isRotatingAtom = atom<boolean>(false);

// Canvas view state
export const scaleAtom = atomWithStorage<number>('canvas-scale', 1);
export const stagePositionAtom = atomWithStorage<{ x: number; y: number }>('canvas-position', { x: 0, y: 0 });

// Grid state
export const gridEnabledAtom = atomWithStorage<boolean>('canvas-grid-enabled', true);
export const gridSizeAtom = atomWithStorage<number>('canvas-grid-size', 20);
export const showGuidesAtom = atomWithStorage<boolean>('canvas-guides-enabled', true);

// Derived atoms
export const isTransformingAtom = atom((get) => {
  return get(isDraggingAtom) || get(isResizingAtom) || get(isRotatingAtom);
});

// Canvas state combined atom
export const canvasStateAtom = atom<CanvasState>((get) => ({
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
*/

// Placeholder exports for TypeScript - remove when jotai is available
export const selectedNodeIdAtom = null as unknown;
export const hoveredNodeIdAtom = null as unknown;
export const isDraggingAtom = null as unknown;
export const isResizingAtom = null as unknown;
export const isRotatingAtom = null as unknown;
export const scaleAtom = null as unknown;
export const stagePositionAtom = null as unknown;
export const gridEnabledAtom = null as unknown;
export const gridSizeAtom = null as unknown;
export const showGuidesAtom = null as unknown;
export const isTransformingAtom = null as unknown;
export const canvasStateAtom = null as unknown;
