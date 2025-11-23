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
  { keys: ['Escape'], description: 'Deselect current node', category: 'Navigation' },

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
      <DialogContent className="max-h-[80vh] w-full max-w-4xl overflow-y-auto lg:max-w-6xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">Keyboard Shortcuts</DialogTitle>
          <DialogDescription className="text-xs">
            Use these shortcuts to navigate and edit canvas nodes. All work when a node is selected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="mb-2 text-xs font-semibold">{category}</h3>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {SHORTCUTS.filter((s) => s.category === category).map((shortcut) => (
                  <div
                    key={`${category}-${shortcut.description}`}
                    className="flex flex-col gap-1 rounded border border-border/40 bg-muted/10 p-2"
                  >
                    <span className="text-xs font-medium text-foreground">{shortcut.description}</span>
                    <div className="flex flex-wrap gap-1">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={`${category}-${shortcut.description}-${key}`}
                          className="rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[10px]"
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

        <div className="rounded border border-border/40 bg-muted/10 p-2">
          <h4 className="mb-1 text-xs font-semibold">Canvas Limitations</h4>
          <ul className="space-y-0.5 text-[10px] text-muted-foreground">
            <li>• Assets can only be selected from your existing library (uploads not supported)</li>
            <li>• Content canvases limited to single level of depth (no nesting)</li>
            <li>• SUB_CANVAS nodes cannot be resized, only repositioned</li>
            <li>• Use Asset Picker to choose from existing assets</li>
          </ul>
        </div>

        <div className="rounded border border-border/40 bg-muted/10 p-2">
          <h4 className="mb-1 text-xs font-semibold">Accessibility</h4>
          <ul className="space-y-0.5 text-[10px] text-muted-foreground">
            <li>• Tab to navigate between canvas controls and nodes list</li>
            <li>• Arrow keys in nodes list move selection up/down</li>
            <li>• Screen readers announce node positions and sizes</li>
            <li>• All actions provide toast notifications</li>
          </ul>
        </div>

        <DialogClose asChild>
          <Button variant="outline" size="sm" className="mt-2" onClick={onClose}>
            <FiX className="mr-1.5 h-3 w-3" />
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
