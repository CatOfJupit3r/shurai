/**
 * Canvas Keyboard Shortcuts Hook
 * Provides keyboard navigation and interaction for canvas nodes
 */
import { useEffect, useEffectEvent } from 'react';
import { toast } from 'react-toastify';

import type { iCanvasNodeData } from '../components/canvas-node';

interface iUseCanvasKeyboardOptions {
  selectedNodeId: string | null;
  nodes: iCanvasNodeData[];
  onNodeUpdate: (nodeId: string, updates: Partial<iCanvasNodeData>) => void;
  onNodeDelete?: (nodeId: string) => void;
  onUndo?: () => void;
  onResetSize?: (nodeId: string) => void;
  onDeselect?: () => void;
  isEnabled?: boolean;
}

const MOVE_STEP = 10;
const MOVE_STEP_LARGE = 50;
const RESIZE_STEP = 10;
const RESIZE_STEP_LARGE = 50;

export function useCanvasKeyboard({
  selectedNodeId,
  nodes,
  onNodeUpdate,
  onNodeDelete,
  onUndo,
  onResetSize,
  onDeselect,
  isEnabled = true,
}: iUseCanvasKeyboardOptions) {
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const handleKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (!isEnabled || !selectedNode) return;

    // Ignore if user is typing in an input field
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const { key, ctrlKey: isCtrlPressed, metaKey: isMetaPressed, shiftKey: isShiftPressed, altKey: isAltPressed } = e;
    const isCmdPressed = isCtrlPressed || isMetaPressed;

    // Escape to deselect
    if (key === 'Escape' && onDeselect) {
      e.preventDefault();
      onDeselect();
      return;
    }

    // Undo (Ctrl/Cmd + Z)
    if (isCmdPressed && key === 'z' && !isShiftPressed && onUndo) {
      e.preventDefault();
      onUndo();
      return;
    }

    // Delete (Delete or Backspace)
    if ((key === 'Delete' || key === 'Backspace') && !isCmdPressed && onNodeDelete) {
      e.preventDefault();
      onNodeDelete(selectedNode.id);
      return;
    }

    // Reset size (Ctrl/Cmd + 0)
    if (isCmdPressed && key === '0' && onResetSize) {
      e.preventDefault();
      onResetSize(selectedNode.id);
      return;
    }

    // Arrow key movements and resizing
    const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
    if (!isArrowKey) return;

    e.preventDefault();

    const step = isShiftPressed ? MOVE_STEP_LARGE : MOVE_STEP;
    const resizeStep = isShiftPressed ? RESIZE_STEP_LARGE : RESIZE_STEP;

    // Check if node is a SUB_CANVAS (nested content node)
    if (selectedNode.type === 'SUB_CANVAS') {
      // Allow movement but not resizing for sub-canvas nodes
      if (isAltPressed) {
        toast.warning('Cannot resize nested content nodes. Content canvas nodes have fixed sizes.');
        return;
      }
    }

    // Resize mode with Alt key
    if (isAltPressed) {
      const currentSize = selectedNode.size;
      let newWidth = currentSize.width;
      let newHeight = currentSize.height;

      switch (key) {
        case 'ArrowRight':
          newWidth = Math.max(10, currentSize.width + resizeStep);
          break;
        case 'ArrowLeft':
          newWidth = Math.max(10, currentSize.width - resizeStep);
          break;
        case 'ArrowDown':
          newHeight = Math.max(10, currentSize.height + resizeStep);
          break;
        case 'ArrowUp':
          newHeight = Math.max(10, currentSize.height - resizeStep);
          break;
        default:
          break;
      }

      onNodeUpdate(selectedNode.id, {
        size: { width: newWidth, height: newHeight },
      });
      return;
    }

    // Move mode (default)
    const currentPosition = selectedNode.position;
    let newX = currentPosition.x;
    let newY = currentPosition.y;

    switch (key) {
      case 'ArrowRight':
        newX += step;
        break;
      case 'ArrowLeft':
        newX -= step;
        break;
      case 'ArrowDown':
        newY += step;
        break;
      case 'ArrowUp':
        newY -= step;
        break;
      default:
        break;
    }

    onNodeUpdate(selectedNode.id, {
      position: { x: newX, y: newY },
    });
  });

  useEffect(() => {
    if (!isEnabled) return undefined;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled]);

  return {
    isEnabled,
    selectedNode,
  };
}
