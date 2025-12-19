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
    iconUrl: 'http://localhost:3030/user-assets/icons/pc.png',
  },
  {
    name: 'Monitor Icon',
    description: 'Generic monitor icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'http://localhost:3030/user-assets/icons/monitor.jpg',
  },
  {
    name: 'Keyboard Icon',
    description: 'Generic keyboard icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'http://localhost:3030/user-assets/icons/keyboard.webp',
  },
  {
    name: 'Mouse Icon',
    description: 'Generic mouse icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'http://localhost:3030/user-assets/icons/mouse.jpg',
  },
  {
    name: 'GPU Icon',
    description: 'Graphics card icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'http://localhost:3030/user-assets/icons/gpu.jpg',
  },
  {
    name: 'CPU Icon',
    description: 'Processor icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'http://localhost:3030/user-assets/icons/cpu.png',
  },
  {
    name: 'RAM Icon',
    description: 'Memory module icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'http://localhost:3030/user-assets/icons/ram.avif',
  },
  {
    name: 'Storage Icon',
    description: 'Hard drive/SSD icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'http://localhost:3030/user-assets/icons/ssd.jpg',
  },
  {
    name: 'Headset Icon',
    description: 'Gaming headset icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'http://localhost:3030/user-assets/icons/headphone.webp',
  },
  {
    name: 'Webcam Icon',
    description: 'Webcam icon',
    type: ASSET_TYPE.ICON,
    iconUrl: 'http://localhost:3030/user-assets/icons/webcam.jpg',
  },

  // Cover images
  {
    name: 'Dark Setup Cover',
    description: 'Dark themed workspace cover',
    type: ASSET_TYPE.COVER,
    imageUrl: 'http://localhost:3030/user-assets/covers/dark-setup-global.jpg',
  },
  {
    name: 'Minimalist Setup Cover',
    description: 'Clean minimalist workspace cover',
    type: ASSET_TYPE.COVER,
    imageUrl: 'http://localhost:3030/user-assets/covers/minimalist-setup-global.jpg',
  },
  {
    name: 'RGB Setup Cover',
    description: 'Colorful RGB workspace cover',
    type: ASSET_TYPE.COVER,
    imageUrl: 'http://localhost:3030/user-assets/covers/rgb-setup-global.jpg',
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
