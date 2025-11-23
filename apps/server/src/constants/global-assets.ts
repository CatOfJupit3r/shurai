import { ASSET_TYPE } from '@shurai/shared/enums/workspace.enums';
import type { AssetType } from '@shurai/shared/enums/workspace.enums';

export interface iGlobalAssetDefinition {
  name: string;
  description?: string;
  type: AssetType;
  iconUrl?: string;
  imageUrl?: string;
  themeConfig?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
}

export const GLOBAL_ASSETS: iGlobalAssetDefinition[] = [
  // Icons for common PC components
  {
    name: 'Default PC Icon',
    description: 'Generic PC tower icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=pc',
  },
  {
    name: 'Monitor Icon',
    description: 'Generic monitor icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=monitor',
  },
  {
    name: 'Keyboard Icon',
    description: 'Generic keyboard icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=keyboard',
  },
  {
    name: 'Mouse Icon',
    description: 'Generic mouse icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=mouse',
  },
  {
    name: 'GPU Icon',
    description: 'Graphics card icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=gpu',
  },
  {
    name: 'CPU Icon',
    description: 'Processor icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=cpu',
  },
  {
    name: 'RAM Icon',
    description: 'Memory module icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=ram',
  },
  {
    name: 'Storage Icon',
    description: 'Hard drive/SSD icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=storage',
  },
  {
    name: 'Headset Icon',
    description: 'Gaming headset icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=headset',
  },
  {
    name: 'Webcam Icon',
    description: 'Webcam icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=webcam',
  },

  // Cover images
  {
    name: 'Dark Setup Cover',
    description: 'Dark themed workspace cover',
    type: ASSET_TYPE.COVER,
    imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1200&h=400&fit=crop',
  },
  {
    name: 'Minimalist Setup Cover',
    description: 'Clean minimalist workspace cover',
    type: ASSET_TYPE.COVER,
    imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1200&h=400&fit=crop',
  },
  {
    name: 'RGB Setup Cover',
    description: 'Colorful RGB workspace cover',
    type: ASSET_TYPE.COVER,
    imageUrl: 'https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=1200&h=400&fit=crop',
  },

  // Theme presets
  {
    name: 'Dark Theme',
    description: 'Professional dark theme',
    type: ASSET_TYPE.THEME_PRESET,
    themeConfig: {
      primaryColor: '#1a1a1a',
      secondaryColor: '#2d2d2d',
      accentColor: '#3b82f6',
    },
  },
  {
    name: 'Light Theme',
    description: 'Clean light theme',
    type: ASSET_TYPE.THEME_PRESET,
    themeConfig: {
      primaryColor: '#ffffff',
      secondaryColor: '#f3f4f6',
      accentColor: '#2563eb',
    },
  },
  {
    name: 'Cyberpunk Theme',
    description: 'Neon cyberpunk theme',
    type: ASSET_TYPE.THEME_PRESET,
    themeConfig: {
      primaryColor: '#0a0e27',
      secondaryColor: '#1a1f3a',
      accentColor: '#ff006e',
    },
  },
  {
    name: 'Nature Theme',
    description: 'Earthy nature theme',
    type: ASSET_TYPE.THEME_PRESET,
    themeConfig: {
      primaryColor: '#1a4d2e',
      secondaryColor: '#2d5f3f',
      accentColor: '#7cb342',
    },
  },
];
