# Canvas State Management Hooks - Usage Examples

This document provides examples of how to use the canvas state management hooks for implementing canvas editing features with dirty tracking, autosave, and navigation guards.

## Overview

The canvas state management system consists of four main hooks:

1. **`useCanvasLayout`** - Fetches canvas layout data from the server
2. **`useSaveCanvasLayout`** - Saves canvas layout with optimistic updates
3. **`useResetCanvasLayout`** - Resets canvas layout to default state
4. **`useCanvasDirtyState`** - Manages dirty state tracking and provides save/reset actions
5. **`useCanvasAutosave`** - Provides automatic saving with debouncing
6. **`useCanvasNavigationGuard`** - Blocks navigation when there are unsaved changes

## Basic Usage

### Simple Canvas with Manual Save

```typescript
import { useState } from 'react';
import {
  useCanvasLayout,
  useCanvasDirtyState,
  type iCanvasNode,
} from '@~/features/canvas';

function CanvasEditor({ workspaceId }: { workspaceId: string }) {
  const { layout, isPending } = useCanvasLayout(workspaceId);
  
  // Local state for editing
  const [nodes, setNodes] = useState<iCanvasNode[]>(layout?.nodes ?? []);
  
  // Dirty state management
  const { isDirty, save, reset, isSaving, isResetting } = useCanvasDirtyState({
    workspaceId,
    currentNodes: nodes,
    currentContentCanvases: layout?.contentCanvases,
    canvasSize: layout?.canvasSize ?? { width: 1920, height: 1080 },
    backgroundColor: layout?.backgroundColor,
    gridEnabled: layout?.gridEnabled,
    gridSize: layout?.gridSize,
  });

  if (isPending) return <div>Loading...</div>;

  return (
    <div>
      <div className="toolbar">
        <button onClick={save} disabled={!isDirty || isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={reset} disabled={!isDirty || isResetting}>
          {isResetting ? 'Resetting...' : 'Reset'}
        </button>
        {isDirty && <span className="unsaved-indicator">● Unsaved changes</span>}
      </div>
      
      <CanvasStage
        nodes={nodes}
        onNodesChange={setNodes}
        // ... other canvas props
      />
    </div>
  );
}
```

### Canvas with Autosave

```typescript
import { useState, useEffect } from 'react';
import {
  useCanvasLayout,
  useCanvasDirtyState,
  useCanvasAutosave,
  type iCanvasNode,
} from '@~/features/canvas';

function AutosaveCanvasEditor({ workspaceId }: { workspaceId: string }) {
  const { layout, isPending } = useCanvasLayout(workspaceId);
  const [nodes, setNodes] = useState<iCanvasNode[]>([]);
  
  // Update local state when layout loads
  useEffect(() => {
    if (layout?.nodes) {
      setNodes(layout.nodes);
    }
  }, [layout?.nodes]);
  
  const dirtyState = useCanvasDirtyState({
    workspaceId,
    currentNodes: nodes,
    currentContentCanvases: layout?.contentCanvases,
    canvasSize: layout?.canvasSize ?? { width: 1920, height: 1080 },
    backgroundColor: layout?.backgroundColor,
    gridEnabled: layout?.gridEnabled,
    gridSize: layout?.gridSize,
  });

  // Enable autosave with 5 second debounce
  useCanvasAutosave({
    isDirty: dirtyState.isDirty,
    save: dirtyState.save,
    isSaving: dirtyState.isSaving,
    enabled: true,
    debounceMs: 5000,
  });

  if (isPending) return <div>Loading...</div>;

  return (
    <div>
      <div className="status-bar">
        {dirtyState.isSaving && <span>Saving...</span>}
        {dirtyState.isDirty && !dirtyState.isSaving && (
          <span>Unsaved changes (will auto-save in 5s)</span>
        )}
        {!dirtyState.isDirty && !dirtyState.isSaving && <span>All changes saved</span>}
      </div>
      
      <CanvasStage
        nodes={nodes}
        onNodesChange={setNodes}
      />
    </div>
  );
}
```

### Canvas with Navigation Guard

```typescript
import { useState } from 'react';
import {
  useCanvasLayout,
  useCanvasDirtyState,
  useCanvasNavigationGuard,
  type iCanvasNode,
} from '@~/features/canvas';

function ProtectedCanvasEditor({ workspaceId }: { workspaceId: string }) {
  const { layout, isPending } = useCanvasLayout(workspaceId);
  const [nodes, setNodes] = useState<iCanvasNode[]>(layout?.nodes ?? []);
  
  const dirtyState = useCanvasDirtyState({
    workspaceId,
    currentNodes: nodes,
    currentContentCanvases: layout?.contentCanvases,
    canvasSize: layout?.canvasSize ?? { width: 1920, height: 1080 },
  });

  // Block navigation when there are unsaved changes
  useCanvasNavigationGuard({
    isDirty: dirtyState.isDirty,
    enabled: true,
    message: 'You have unsaved canvas changes. Are you sure you want to leave?',
  });

  if (isPending) return <div>Loading...</div>;

  return (
    <div>
      <div className="toolbar">
        <button onClick={dirtyState.save} disabled={!dirtyState.isDirty}>
          Save Changes
        </button>
        {dirtyState.isDirty && (
          <div className="warning">
            ⚠️ You have unsaved changes. Save before leaving the page.
          </div>
        )}
      </div>
      
      <CanvasStage
        nodes={nodes}
        onNodesChange={setNodes}
      />
    </div>
  );
}
```

### Complete Example with All Features

```typescript
import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  useCanvasLayout,
  useCanvasDirtyState,
  useCanvasAutosave,
  useCanvasNavigationGuard,
  gridEnabledAtom,
  gridSizeAtom,
  type iCanvasNode,
  type iContentCanvas,
} from '@~/features/canvas';

interface CanvasEditorProps {
  workspaceId: string;
  enableAutosave?: boolean;
  autosaveDelay?: number;
}

function FullFeaturedCanvasEditor({
  workspaceId,
  enableAutosave = true,
  autosaveDelay = 3000,
}: CanvasEditorProps) {
  const { layout, isPending, error } = useCanvasLayout(workspaceId);
  
  // Local canvas state
  const [nodes, setNodes] = useState<iCanvasNode[]>([]);
  const [contentCanvases, setContentCanvases] = useState<iContentCanvas[]>([]);
  
  // Grid settings from global atoms
  const [gridEnabled, setGridEnabled] = useAtom(gridEnabledAtom);
  const [gridSize, setGridSize] = useAtom(gridSizeAtom);
  
  // Initialize local state from loaded layout
  useEffect(() => {
    if (layout) {
      setNodes(layout.nodes);
      setContentCanvases(layout.contentCanvases ?? []);
    }
  }, [layout]);
  
  // Dirty state management
  const dirtyState = useCanvasDirtyState({
    workspaceId,
    currentNodes: nodes,
    currentContentCanvases: contentCanvases,
    canvasSize: layout?.canvasSize ?? { width: 1920, height: 1080 },
    backgroundColor: layout?.backgroundColor,
    gridEnabled,
    gridSize,
  });

  // Autosave
  useCanvasAutosave({
    isDirty: dirtyState.isDirty,
    save: dirtyState.save,
    isSaving: dirtyState.isSaving,
    enabled: enableAutosave,
    debounceMs: autosaveDelay,
  });

  // Navigation guard
  useCanvasNavigationGuard({
    isDirty: dirtyState.isDirty,
    enabled: true,
  });

  if (isPending) return <div>Loading canvas...</div>;
  if (error) return <div>Error loading canvas: {error.message}</div>;
  if (!layout) return <div>No layout found</div>;

  return (
    <div className="canvas-editor">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-section">
          <button
            onClick={dirtyState.save}
            disabled={!dirtyState.isDirty || dirtyState.isSaving}
            className="btn-primary"
          >
            {dirtyState.isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={dirtyState.reset}
            disabled={!dirtyState.isDirty || dirtyState.isResetting}
            className="btn-secondary"
          >
            {dirtyState.isResetting ? 'Resetting...' : 'Reset to Default'}
          </button>
        </div>
        
        <div className="toolbar-section">
          <label>
            <input
              type="checkbox"
              checked={gridEnabled}
              onChange={(e) => setGridEnabled(e.target.checked)}
            />
            Show Grid
          </label>
          <label>
            Grid Size:
            <input
              type="number"
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              min={10}
              max={100}
            />
          </label>
        </div>
        
        {/* Status indicator */}
        <div className="status-indicator">
          {dirtyState.isSaving && <span className="saving">● Saving...</span>}
          {dirtyState.isDirty && !dirtyState.isSaving && (
            <span className="unsaved">
              ● Unsaved changes
              {enableAutosave && ` (auto-saving in ${autosaveDelay / 1000}s)`}
            </span>
          )}
          {!dirtyState.isDirty && !dirtyState.isSaving && (
            <span className="saved">✓ All changes saved</span>
          )}
        </div>
      </div>

      {/* Canvas */}
      <CanvasStage
        nodes={nodes}
        onNodesChange={setNodes}
        contentCanvases={contentCanvases}
        onContentCanvasesChange={setContentCanvases}
        canvasSize={layout.canvasSize}
        backgroundColor={layout.backgroundColor}
        gridEnabled={gridEnabled}
        gridSize={gridSize}
      />
    </div>
  );
}
```

## Hook Reference

### useCanvasDirtyState

Manages dirty state tracking and provides save/reset actions.

```typescript
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
  isDirty: boolean;           // Whether there are unsaved changes
  save: () => void;            // Save current state
  reset: () => void;           // Reset to default state
  markClean: () => void;       // Manually mark as clean
  markDirty: () => void;       // Manually mark as dirty
  isSaving: boolean;           // Whether save is in progress
  isResetting: boolean;        // Whether reset is in progress
}
```

### useCanvasAutosave

Enables automatic saving with debouncing.

```typescript
interface iUseCanvasAutosaveOptions {
  isDirty: boolean;
  save: () => void;
  isSaving: boolean;
  enabled?: boolean;      // Default: true
  debounceMs?: number;    // Default: 3000
}
```

### useCanvasNavigationGuard

Blocks navigation when there are unsaved changes.

```typescript
interface iUseCanvasNavigationGuardOptions {
  isDirty: boolean;
  enabled?: boolean;      // Default: true
  message?: string;       // Default: 'You have unsaved changes. Are you sure you want to leave?'
}
```

## State Management with Jotai Atoms

The canvas feature uses Jotai atoms for state management. The dirty state tracking atoms are:

```typescript
// Dirty state tracking
export const isDirtyAtom = atom<boolean>(false);
export const lastSavedNodesAtom = atom<iCanvasNode[]>([]);
export const lastSavedContentCanvasesAtom = atom<iContentCanvas[]>([]);

// Canvas UI state
export const gridEnabledAtom = atomWithStorage<boolean>('canvas-grid-enabled', true);
export const gridSizeAtom = atomWithStorage<number>('canvas-grid-size', 20);
export const selectedNodeIdAtom = atom<string | null>(null);
// ... other atoms
```

These atoms are automatically managed by the hooks, but you can also access them directly if needed using `useAtom` from Jotai.

## Best Practices

1. **Initialize local state from server data**: Always use `useEffect` to initialize local editing state when layout loads
2. **Use autosave for better UX**: Enable autosave for canvas editors to prevent data loss
3. **Add navigation guards**: Protect against accidental navigation away from unsaved changes
4. **Show clear status indicators**: Display saving state and unsaved changes prominently
5. **Provide manual save option**: Even with autosave, give users a manual save button for control
6. **Handle loading and error states**: Always handle `isPending` and `error` from query hooks

## Troubleshooting

### Autosave not triggering

- Check that `enabled` is `true`
- Ensure `isDirty` is correctly reflecting changes
- Verify `isSaving` is not stuck in `true` state
- Check console for any save errors

### Dirty state not updating

- Ensure all relevant props are passed to `useCanvasDirtyState`
- Check that local state is properly connected to canvas nodes
- Verify that `markClean()` is being called after successful saves

### Navigation guard not working

- Confirm `isDirty` is properly set
- Check that `enabled` is `true`
- Test in different browsers (some browsers handle `beforeunload` differently)
