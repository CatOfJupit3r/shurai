/**
 * Keyboard Shortcuts Help Modal
 * Displays all available keyboard shortcuts for canvas navigation
 */
import { FiX } from 'react-icons/fi';

import { Button } from '@~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@~/components/ui/dialog';

interface iKeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface iShortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: iShortcut[] = [
  // Navigation
  { keys: ['←', '↑', '→', '↓'], description: 'Move selected node (10px)', category: 'Navigation' },
  { keys: ['Shift', '←', '↑', '→', '↓'], description: 'Move selected node (50px)', category: 'Navigation' },
  { keys: ['Tab'], description: 'Navigate through nodes list', category: 'Navigation' },
  { keys: ['Enter'], description: 'Select focused node', category: 'Navigation' },

  // Editing
  { keys: ['Alt', '←', '↑', '→', '↓'], description: 'Resize selected node (10px)', category: 'Editing' },
  {
    keys: ['Shift', 'Alt', '←', '↑', '→', '↓'],
    description: 'Resize selected node (50px)',
    category: 'Editing',
  },
  { keys: ['Delete'], description: 'Delete selected node', category: 'Editing' },
  { keys: ['Backspace'], description: 'Delete selected node', category: 'Editing' },
  { keys: ['Ctrl', '0'], description: 'Reset node to default size', category: 'Editing' },

  // History
  { keys: ['Ctrl', 'Z'], description: 'Undo last change', category: 'History' },
  { keys: ['Ctrl', 'S'], description: 'Save canvas layout', category: 'History' },

  // View
  { keys: ['Scroll'], description: 'Zoom in/out', category: 'View' },
  { keys: ['Drag'], description: 'Pan canvas', category: 'View' },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: iKeyboardShortcutsModalProps) {
  const categories = Array.from(new Set(SHORTCUTS.map((s) => s.category)));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and edit canvas nodes without a mouse. All shortcuts work when a
            node is selected.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="mb-3 text-sm font-semibold">{category}</h3>
              <div className="space-y-2">
                {SHORTCUTS.filter((s) => s.category === category).map((shortcut) => (
                  <div
                    key={`${category}-${shortcut.description}`}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="text-muted-foreground">{shortcut.description}</span>
                    <div className="flex shrink-0 gap-1">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={`${category}-${shortcut.description}-${key}`}
                          className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs shadow-sm"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
          <h4 className="mb-2 text-sm font-semibold">Canvas Limitations</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Assets can only be selected from your existing library (uploads are not supported)</li>
            <li>• Content canvases are limited to a single level of depth (no nested content canvases)</li>
            <li>• Content canvas nodes (SUB_CANVAS type) cannot be resized, only repositioned</li>
            <li>• Use the Asset Picker to choose from existing assets when editing nodes</li>
          </ul>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-muted/50 p-4">
          <h4 className="mb-2 text-sm font-semibold">Accessibility Notes</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Use Tab to navigate between canvas controls and the nodes list</li>
            <li>• Arrow keys in the nodes list will move selection up/down</li>
            <li>• Screen readers will announce node positions and sizes</li>
            <li>• All actions provide toast notifications for feedback</li>
          </ul>
        </div>

        <DialogClose asChild>
          <Button variant="outline" className="mt-4" onClick={onClose}>
            <FiX className="mr-2" />
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
