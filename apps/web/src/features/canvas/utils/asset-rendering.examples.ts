/**
 * Example Usage of Asset Rendering Helpers
 *
 * This file demonstrates various use cases for the asset rendering utilities.
 * These examples can be used as reference when integrating the helpers into
 * canvas components or other parts of the application.
 */
import type { iAssetMetadata } from './asset-rendering';
import {
  getAssetImageUrl,
  getAssetDimensions,
  loadAndCacheImage,
  getCachedImage,
  preloadImages,
  getPlaceholderConfig,
  getKonvaNodeProps,
  clearImageCache,
  getImageCacheStats,
} from './asset-rendering';

/**
 * Example 1: Basic Image Loading
 * Load a single asset image with caching
 */
export async function exampleBasicImageLoading(asset: iAssetMetadata) {
  const imageUrl = getAssetImageUrl(asset);

  if (!imageUrl) {
    console.log('No image URL available, using placeholder');
    return null;
  }

  try {
    const image = await loadAndCacheImage(imageUrl);
    console.log(`Image loaded: ${image.width}x${image.height}`);
    return image;
  } catch (error) {
    console.error('Failed to load image:', error);
    return null;
  }
}

/**
 * Example 2: Preloading Multiple Assets
 * Useful for loading all canvas images before rendering
 */
export async function examplePreloadCanvasAssets(assets: iAssetMetadata[]) {
  const imageUrls = assets.map(getAssetImageUrl).filter((url): url is string => url !== null);

  console.log(`Preloading ${imageUrls.length} images...`);

  try {
    const images = await preloadImages(imageUrls);
    console.log(`Successfully preloaded ${images.length} images`);
    return images;
  } catch (error) {
    console.error('Some images failed to preload:', error);
    return [];
  }
}

/**
 * Example 3: Rendering with Fallback
 * Check cache first, use placeholder if not available
 */
export function exampleRenderWithFallback(asset: iAssetMetadata | null) {
  const imageUrl = getAssetImageUrl(asset);
  const cachedImage = getCachedImage(imageUrl);

  if (cachedImage) {
    console.log('Using cached image');
    return {
      image: cachedImage,
      usePlaceholder: false,
    };
  }

  console.log('Image not cached, using placeholder');
  const placeholder = getPlaceholderConfig(asset?.type);

  return {
    image: null,
    usePlaceholder: true,
    placeholder,
  };
}

/**
 * Example 4: Aspect Ratio Preservation
 * Calculate dimensions that maintain the original aspect ratio
 */
export function exampleAspectRatioHandling(asset: iAssetMetadata, targetWidth: number) {
  const imageUrl = getAssetImageUrl(asset);
  const image = getCachedImage(imageUrl);

  if (!image) {
    // Use default dimensions if image not loaded
    return getAssetDimensions(asset, {
      defaultWidth: targetWidth,
    });
  }

  // Preserve aspect ratio based on natural dimensions
  const dimensions = getAssetDimensions(asset, {
    defaultWidth: targetWidth,
    shouldMaintainAspectRatio: true,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
  });

  console.log(`Original: ${image.naturalWidth}x${image.naturalHeight}`);
  console.log(`Scaled: ${dimensions.width}x${dimensions.height}`);

  return dimensions;
}

/**
 * Example 5: Complete Konva Node Setup
 * Generate all props needed for a Konva node
 */
export function exampleKonvaNodeSetup(asset: iAssetMetadata | null) {
  const props = getKonvaNodeProps(asset, {
    position: { x: 100, y: 100 },
    size: { width: 200, height: 200 },
    rotation: 0,
    opacity: 1,
  });

  console.log('Konva Node Props:', {
    hasImage: props.hasImage,
    imageUrl: props.imageUrl,
    fillColor: props.fillColor,
    dimensions: props.size,
  });

  return props;
}

/**
 * Example 6: Cache Management
 * Monitor and manage the image cache
 */
export function exampleCacheManagement() {
  // Get current cache stats
  const stats = getImageCacheStats();
  console.log('Cache Stats:', stats);

  // Clear cache if too large
  if (stats.totalSize > 100) {
    console.log('Cache size exceeds limit, clearing...');
    clearImageCache();
  }

  // Or clear specific URLs that are no longer needed
  const unusedUrl = 'https://example.com/old-image.png';
  clearImageCache(unusedUrl);
}

/**
 * Example 7: Progressive Loading Pattern
 * Show placeholder immediately, then swap to actual image when loaded
 */
export async function exampleProgressiveLoading(
  asset: iAssetMetadata,
  onUpdate: (image: HTMLImageElement | null, isLoading: boolean) => unknown,
) {
  const imageUrl = getAssetImageUrl(asset);

  // Check if already cached
  const cached = getCachedImage(imageUrl);
  if (cached) {
    onUpdate(cached, false);
    return;
  }

  // Show placeholder while loading
  onUpdate(null, true);

  // Load image
  if (imageUrl) {
    try {
      const image = await loadAndCacheImage(imageUrl);
      onUpdate(image, false);
    } catch (error) {
      console.error('Failed to load image:', error);
      onUpdate(null, false);
    }
  } else {
    onUpdate(null, false);
  }
}

/**
 * Example 8: Batch Loading with Progress
 * Load multiple images with progress tracking
 */
export async function exampleBatchLoadingWithProgress(
  assets: iAssetMetadata[],
  onProgress: (loaded: number, total: number) => unknown,
) {
  const imageUrls = assets.map(getAssetImageUrl).filter((url): url is string => url !== null);

  let loaded = 0;
  const total = imageUrls.length;

  const promises = imageUrls.map(async (url) => {
    try {
      const image = await loadAndCacheImage(url);
      loaded += 1;
      onProgress(loaded, total);
      return image;
    } catch (error) {
      console.error(`Failed to load ${url}:`, error);
      loaded += 1;
      onProgress(loaded, total);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((img): img is HTMLImageElement => img !== null);
}

/**
 * Example 9: Theme-Aware Placeholder
 * Use asset theme colors for placeholder rendering
 */
export function exampleThemeAwarePlaceholder(asset: iAssetMetadata | null) {
  const props = getKonvaNodeProps(asset);

  // The fill color will use the asset's theme primary color if available,
  // otherwise it falls back to the type-specific placeholder color
  return {
    fillColor: props.fillColor,
    primaryColor: props.primaryColor,
    usesThemeColor: props.primaryColor !== undefined,
  };
}

/**
 * Example 10: Cleanup on Component Unmount
 * Properly clean up resources when component is destroyed
 */
export function exampleCleanupPattern(assetUrls: string[]) {
  // This would typically be in a useEffect cleanup function
  return () => {
    console.log('Cleaning up asset cache...');

    // Option 1: Clear specific URLs
    assetUrls.forEach((url) => clearImageCache(url));

    // Option 2: Clear entire cache (if appropriate)
    // clearImageCache();

    console.log('Cleanup complete');
  };
}
