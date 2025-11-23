# Asset Rendering Helpers

Utilities for mapping asset metadata to Konva node props with optimized image loading and caching.

## Features

- **Image Caching**: In-memory cache prevents redundant network calls
- **Aspect Ratio Preservation**: Automatically maintains correct proportions
- **Fallback Graphics**: Graceful handling of missing assets with placeholder visuals
- **Type-based Defaults**: Different default dimensions for ICON, IMAGE, COVER, and THEME_PRESET
- **Theme Integration**: Uses asset theme colors for placeholder backgrounds
- **Parallel Preloading**: Batch preload images for better performance

## Core Functions

### `getAssetImageUrl(asset)`

Resolves the best image URL from asset metadata.

```typescript
const imageUrl = getAssetImageUrl(asset);
// For ICON type: prioritizes iconUrl over imageUrl
// For other types: prioritizes imageUrl over iconUrl
```

### `getAssetDimensions(asset, options)`

Calculates dimensions with optional aspect ratio handling.

```typescript
const dimensions = getAssetDimensions(asset, {
  defaultWidth: 200,
  defaultHeight: 200,
  shouldMaintainAspectRatio: true,
  naturalWidth: image.naturalWidth,
  naturalHeight: image.naturalHeight,
});
```

### `loadAndCacheImage(url)`

Loads an image from URL with automatic caching.

```typescript
try {
  const image = await loadAndCacheImage(imageUrl);
  // Image is now cached for subsequent calls
} catch (error) {
  // Handle loading error
}
```

### `getCachedImage(url)`

Synchronously retrieves a cached image (returns null if not cached).

```typescript
const image = getCachedImage(imageUrl);
if (image) {
  // Use cached image immediately
}
```

### `preloadImages(urls)`

Preloads multiple images in parallel.

```typescript
const images = await preloadImages([url1, url2, url3]);
// All images are now cached and ready for instant use
```

### `getPlaceholderConfig(assetType)`

Returns placeholder configuration for missing assets.

```typescript
const placeholder = getPlaceholderConfig('ICON');
// Returns: { fillColor, strokeColor, dimensions }
```

### `getKonvaNodeProps(asset, options)`

Generates complete Konva-compatible node properties.

```typescript
const props = getKonvaNodeProps(asset, {
  position: { x: 100, y: 100 },
  size: { width: 200, height: 200 },
  rotation: 45,
  opacity: 0.8,
});

// Returns all properties needed for rendering:
// { position, size, rotation, opacity, fillColor, strokeColor,
//   imageUrl, image, primaryColor, hasImage }
```

### Cache Management

```typescript
// Clear specific URL from cache
clearImageCache(imageUrl);

// Clear entire cache
clearImageCache();

// Get cache statistics
const stats = getImageCacheStats();
console.log(`Cached: ${stats.cachedCount}, Loading: ${stats.loadingCount}`);
```

## Integration Example

The helpers are integrated into `CanvasNode` component:

```typescript
import { loadAndCacheImage, getKonvaNodeProps, getPlaceholderConfig } from '../utils/asset-rendering';

// In component:
useEffect(() => {
  if (asset) {
    const konvaProps = getKonvaNodeProps(asset, {
      position: node.position,
      size: node.size,
      rotation: node.rotation,
      opacity: node.opacity,
    });

    if (konvaProps.imageUrl) {
      loadAndCacheImage(konvaProps.imageUrl)
        .then((img) => setImage(img))
        .catch(() => setImage(null));
    }
  }
}, [asset, node]);
```

## Default Dimensions

Different asset types have different default dimensions:

- **ICON**: 64×64px
- **IMAGE**: 200×200px
- **COVER**: 400×300px
- **THEME_PRESET**: 100×100px

## Placeholder Colors

Each asset type has a distinct placeholder color:

- **ICON**: Light blue (#dbeafe)
- **IMAGE**: Light indigo (#e0e7ff)
- **COVER**: Light purple (#f3e8ff)
- **THEME_PRESET**: Light yellow (#fef3c7)

## Performance Benefits

1. **No Flickering**: Images are cached and reused across components
2. **Reduced Network Calls**: Each unique URL is loaded only once
3. **Parallel Loading**: `preloadImages()` loads multiple images concurrently
4. **Optimized Re-renders**: Synchronous `getCachedImage()` for instant access

## Memory Management

The cache is stored in memory for the lifetime of the application. To manage memory:

```typescript
// Clear cache when navigating away from canvas
useEffect(() => {
  return () => {
    clearImageCache();
  };
}, []);

// Or clear specific images no longer needed
clearImageCache(oldImageUrl);
```
