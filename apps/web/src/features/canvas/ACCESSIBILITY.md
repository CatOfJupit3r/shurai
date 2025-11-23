# Canvas Accessibility Implementation

This document describes the accessibility features implemented for the canvas editor to meet WCAG 2.1 Level AA standards and provide a keyboard-first experience.

## Overview

The canvas editor now supports full keyboard navigation and control, allowing users to interact with canvas nodes without requiring a pointing device. All features include proper ARIA labeling and screen reader support.

## Keyboard Shortcuts

### Navigation

- **Arrow Keys** (↑ ↓ ← →): Move selected node by 10 pixels
- **Shift + Arrow Keys**: Move selected node by 50 pixels (large step)
- **Tab**: Navigate between UI controls and the nodes list
- **Enter**: Select focused node from the list

### Editing

- **Alt + Arrow Keys** (↑ ↓ ← →): Resize selected node by 10 pixels
- **Shift + Alt + Arrow Keys**: Resize selected node by 50 pixels (large step)
- **Delete** or **Backspace**: Delete the selected node
- **Ctrl/Cmd + 0**: Reset selected node to default size (200×200)

### History

- **Ctrl/Cmd + Z**: Undo the last change
- **Ctrl/Cmd + S**: Save canvas layout

### View

- **Mouse Wheel**: Zoom in/out on the canvas
- **Drag Canvas**: Pan around the canvas view

## Accessibility Features

### 1. Nodes List Panel

Located in the left sidebar (toggle with "Nodes" button):

- Shows all canvas nodes in a scrollable list
- Each node displays its type, position, and size
- Selected node is visually highlighted
- Arrow keys navigate up/down through the list
- Auto-scrolls to keep selected node visible
- Proper ARIA roles (`listbox`, `option`)
- Screen reader friendly with descriptive labels

### 2. Keyboard Shortcuts Modal

Access via "Shortcuts" button in the header:

- Comprehensive documentation of all shortcuts
- Organized by category (Navigation, Editing, History, View)
- Includes accessibility notes
- Visual representation of key combinations

### 3. History & Undo System

- Tracks up to 50 canvas state changes
- Undo reverts to previous state
- Toast notifications provide feedback
- History is cleared on save

### 4. Protected Node Types

- SUB_CANVAS (content canvas) nodes cannot be resized via keyboard
- Attempting to resize shows a warning toast
- Movement is still allowed for positioning

### 5. Visual Feedback

- Toast notifications for all actions (delete, undo, reset, etc.)
- Selected node highlighted in both canvas and list
- Unsaved changes indicator in header
- Reset button appears when changes exist

## Screen Reader Support

All interactive elements include:

- Descriptive `aria-label` attributes
- Proper role assignments (`button`, `listbox`, `option`, etc.)
- Active descendant tracking for list navigation
- Meaningful names for all controls

### Example Announcements

- "Canvas nodes listbox. 5 nodes."
- "ASSET node at (120, 240), size 200×150"
- "Node deleted. ASSET node removed from canvas"
- "Size reset. Node size restored to default"

## Focus Management

The canvas implements proper focus management:

1. Header controls are naturally focusable
2. Nodes list has `tabindex="0"` for keyboard access
3. List items are focusable with proper ARIA
4. Modals trap focus when open
5. Keyboard shortcuts disabled when modals are open

## Limitations & Known Issues

### Limitations by Design

1. **Content Canvas Nodes**: SUB_CANVAS nodes cannot be resized to preserve layout consistency. They can only be moved.
2. **Mouse-Only Features**: Initial node creation and certain drag operations require a pointing device.
3. **Transform Handles**: Fine rotation adjustment via transform handles requires mouse interaction.

### Workarounds

- Use the Inspector Panel to manually adjust rotation values
- Use keyboard shortcuts for most editing tasks
- Combine mouse and keyboard for optimal workflow

## Testing Recommendations

### Keyboard-Only Testing

1. Navigate to canvas route using Tab
2. Open nodes list with Tab → Enter
3. Use Arrow keys to navigate nodes
4. Press Enter to select a node
5. Use keyboard shortcuts to move/resize
6. Verify toast notifications appear
7. Test undo with Ctrl+Z
8. Save changes with Ctrl+S

### Screen Reader Testing

1. Enable NVDA, JAWS, or VoiceOver
2. Navigate through the interface
3. Verify all controls are announced
4. Check node list announcements
5. Verify action feedback is read
6. Test modal focus trapping

### Focus Order Testing

1. Tab through all controls
2. Verify logical order: Header → Nodes List → Inspector
3. Check that focus returns after modal close
4. Verify no focus traps in normal flow

## Implementation Details

### Key Components

- `useCanvasKeyboard` - Keyboard event handling hook
- `useCanvasHistory` - History stack management hook
- `CanvasNodesList` - Accessible list component
- `KeyboardShortcutsModal` - Help documentation modal

### State Management

- History tracked per workspace
- Maximum 50 states in history
- Deep cloning prevents mutation
- History cleared on reset to saved state

### Event Handling

- Global keydown listeners when canvas is active
- Events stopped when typing in input fields
- Modals disable canvas keyboard shortcuts
- Proper cleanup on unmount

## Future Enhancements

Potential improvements for future iterations:

1. Redo functionality (Ctrl+Shift+Z)
2. Multi-node selection
3. Copy/paste nodes
4. Keyboard-based node creation
5. Snap-to-grid with keyboard
6. Group selection via keyboard
7. Layer ordering via keyboard (bring forward/back)

## Compliance

This implementation addresses:

- WCAG 2.1 Level AA (keyboard navigation)
- ARIA Authoring Practices Guide
- Section 508 compliance
- User feedback requirements

All interactive elements are keyboard accessible, properly labeled, and provide sufficient feedback for assistive technology users.
