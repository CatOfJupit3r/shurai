/**
 * Asset Rendering Helpers for React-Konva
 *
 * Utilities to map asset metadata to Konva node props, handling icons, images,
 * and default sizing with optimized image loading and caching.
 */
import type { AssetType } from '@shurai/shared/enums/workspace.enums';

// In-memory cache for loaded images
const imageCache = new Map<string, HTMLImageElement>();
const imageLoadPromises = new Map<string, Promise<HTMLImageElement>>();

/**
 * Asset metadata interface matching the backend schema
 */
export interface iAssetMetadata {
  _id: string;
  name: string;
  type: AssetType;
  iconUrl?: string;
  imageUrl?: string;
  themeConfig?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
}

/**
 * Default dimensions for different asset types (in pixels)
 */
const DEFAULT_DIMENSIONS = {
  ICON: { width: 64, height: 64 },
  IMAGE: { width: 200, height: 200 },
  COVER: { width: 400, height: 300 },
  THEME_PRESET: { width: 100, height: 100 },
} as const;

/**
 * Placeholder colors for different asset types
 */
const PLACEHOLDER_COLORS = {
  ICON: '#dbeafe',
  IMAGE: '#e0e7ff',
  COVER: '#f3e8ff',
  THEME_PRESET: '#fef3c7',
} as const;

/**
 * Get the best image URL from asset metadata
 * Prioritizes iconUrl for ICON type, imageUrl for others
 */
export function getAssetImageUrl(asset: iAssetMetadata | null | undefined): string | null {
  if (!asset) return null;

  // For ICON type, prefer iconUrl
  if (asset.type === 'ICON') {
    return asset.iconUrl ?? asset.imageUrl ?? null;
  }

  // For other types, prefer imageUrl
  return asset.imageUrl ?? asset.iconUrl ?? null;
}

/**
 * Calculate dimensions maintaining aspect ratio
 */
export function getAssetDimensions(
  asset: iAssetMetadata | null | undefined,
  options?: {
    defaultWidth?: number;
    defaultHeight?: number;
    shouldMaintainAspectRatio?: boolean;
    naturalWidth?: number;
    naturalHeight?: number;
  },
): { width: number; height: number } {
  const { defaultWidth, defaultHeight, shouldMaintainAspectRatio = true, naturalWidth, naturalHeight } = options ?? {};

  // Get default dimensions based on asset type
  const typeDefaults = asset ? DEFAULT_DIMENSIONS[asset.type] : DEFAULT_DIMENSIONS.IMAGE;
  const width = defaultWidth ?? typeDefaults.width;
  const height = defaultHeight ?? typeDefaults.height;

  // If we have natural dimensions and should maintain aspect ratio
  if (shouldMaintainAspectRatio && naturalWidth && naturalHeight) {
    const aspectRatio = naturalWidth / naturalHeight;

    // If provided dimensions are wider than aspect ratio, constrain by width
    if (width / height > aspectRatio) {
      return {
        width: height * aspectRatio,
        height,
      };
    }
    // Otherwise, constrain by height
    return {
      width,
      height: width / aspectRatio,
    };
  }

  return { width, height };
}

/**
 * Load an image from URL with caching
 * Returns a promise that resolves to the HTMLImageElement
 */
export async function loadAndCacheImage(url: string): Promise<HTMLImageElement> {
  // Check cache first
  const cached = imageCache.get(url);
  if (cached) {
    return Promise.resolve(cached);
  }

  // Check if already loading
  const existingPromise = imageLoadPromises.get(url);
  if (existingPromise) {
    return existingPromise;
  }

  // Create new load promise
  const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      imageCache.set(url, img);
      imageLoadPromises.delete(url);
      resolve(img);
    };

    img.onerror = (error) => {
      imageLoadPromises.delete(url);
      reject(new Error(`Failed to load image: ${url}`, { cause: error }));
    };

    img.src = url;
  });

  imageLoadPromises.set(url, loadPromise);
  return loadPromise;
}

/**
 * Preload multiple images in parallel
 * Useful for preloading textures before rendering
 */
export async function preloadImages(urls: string[]): Promise<Array<HTMLImageElement>> {
  const uniqueUrls = [...new Set(urls.filter((url) => url && url.length > 0))];
  return Promise.all(uniqueUrls.map(async (url) => loadAndCacheImage(url)));
}

/**
 * Get cached image synchronously (returns null if not cached)
 * Use this for immediate rendering without async
 */
export function getCachedImage(url: string | null | undefined): HTMLImageElement | null {
  if (!url) return null;
  return imageCache.get(url) ?? null;
}

/**
 * Clear image cache (useful for memory management)
 */
export function clearImageCache(url?: string) {
  if (url) {
    imageCache.delete(url);
    imageLoadPromises.delete(url);
  } else {
    imageCache.clear();
    imageLoadPromises.clear();
  }
}

/**
 * Get image cache stats for debugging
 */
export function getImageCacheStats(): {
  cachedCount: number;
  loadingCount: number;
  totalSize: number;
} {
  return {
    cachedCount: imageCache.size,
    loadingCount: imageLoadPromises.size,
    totalSize: imageCache.size + imageLoadPromises.size,
  };
}

/**
 * Get placeholder configuration for missing assets
 */
export function getPlaceholderConfig(assetType?: AssetType): {
  fillColor: string;
  strokeColor: string;
  dimensions: { width: number; height: number };
} {
  const type = assetType ?? 'IMAGE';
  return {
    fillColor: PLACEHOLDER_COLORS[type],
    strokeColor: '#94a3b8',
    dimensions: DEFAULT_DIMENSIONS[type],
  };
}

/**
 * Generate Konva-compatible node props from asset metadata
 */
export function getKonvaNodeProps(
  asset: iAssetMetadata | null | undefined,
  options?: {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    rotation?: number;
    opacity?: number;
    zIndex?: number;
  },
): {
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  fillColor: string;
  strokeColor: string;
  imageUrl: string | null;
  image: HTMLImageElement | null;
  primaryColor?: string;
  hasImage: boolean;
} {
  const imageUrl = getAssetImageUrl(asset);
  const cachedImage = getCachedImage(imageUrl);
  const placeholder = getPlaceholderConfig(asset?.type);

  // Calculate dimensions based on natural image size if available
  const { defaultWidth, defaultHeight, ...restOptions } = options?.size
    ? { defaultWidth: options.size.width, defaultHeight: options.size.height }
    : {};
  const dimensions = getAssetDimensions(asset, {
    defaultWidth,
    defaultHeight,
    shouldMaintainAspectRatio: true,
    naturalWidth: cachedImage?.naturalWidth,
    naturalHeight: cachedImage?.naturalHeight,
    ...restOptions,
  });

  // Use theme primary color if available for placeholder fill
  const { fillColor, strokeColor } = {
    fillColor: asset?.themeConfig?.primaryColor ?? placeholder.fillColor,
    strokeColor: placeholder.strokeColor,
  };

  return {
    position: options?.position ?? { x: 0, y: 0 },
    size: options?.size ?? dimensions,
    rotation: options?.rotation ?? 0,
    opacity: options?.opacity ?? 1,
    fillColor,
    strokeColor,
    imageUrl,
    image: cachedImage,
    primaryColor: asset?.themeConfig?.primaryColor,
    hasImage: !!cachedImage,
  };
}

/**
 * Hook-friendly wrapper for loading images with state
 * Returns loading state and cached image
 */
export function useImageLoader(url: string | null | undefined): {
  image: HTMLImageElement | null;
  isLoading: boolean;
  error: Error | null;
} {
  // Check if already cached
  const cached = getCachedImage(url);
  if (cached) {
    return {
      image: cached,
      isLoading: false,
      error: null,
    };
  }

  // Check if loading
  const isLoading = url ? imageLoadPromises.has(url) : false;

  return {
    image: null,
    isLoading,
    error: null,
  };
}
