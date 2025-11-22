# Canvas Feature Implementation

## Overview
This feature implements a React-Konva based canvas view for workspace items with Jotai state management.

## Required Dependencies

The following packages need to be installed in `apps/web/package.json`:

```json
{
  "dependencies": {
    "jotai": "^2.15.1",
    "konva": "^9.3.24",
    "react-konva": "^18.2.12"
  }
}
```

## Installation

Due to a current issue with Bun 1.3.3, packages cannot be installed automatically. Please use one of these methods:

### Method 1: Docker with Bun 1.2.21
```bash
docker run --rm -v "$(pwd):/app" -w /app oven/bun:1.1.29 bun install
```

### Method 2: Use NPM (with corepack)
```bash
corepack enable
corepack prepare yarn@bun@1.2.21 --activate
yarn install
```

### Method 3: Manual Installation
Add the packages to `package.json` and run bun install when the environment issue is resolved.

## Structure

- `/hooks` - TanStack Query hooks for fetching and mutating canvas data
- `/store` - Jotai atoms for canvas state management
- `/components` - React-Konva canvas components
- `/utils` - Helper functions for canvas operations

## Features

- ✅ Canvas layout query hook
- ✅ Canvas layout mutation hook with optimistic updates
- ✅ Jotai atoms for state management (needs jotai package)
- ⏳ React-Konva canvas components (needs react-konva package)
- ⏳ Inspector panel for node properties
- ⏳ Grid overlay and guides
- ⏳ Selection, move, resize, rotate controls

## Next Steps

1. Install required dependencies
2. Uncomment Jotai atom implementations in `store/canvas-atoms.ts`
3. Create React-Konva components in `components/`
4. Create the main canvas route
5. Test the implementation
