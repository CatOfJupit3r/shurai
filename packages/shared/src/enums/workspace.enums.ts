import { z } from 'zod';

// Workspace visibility levels
export const WorkspaceVisibilitySchema = z.enum(['PUBLIC', 'PRIVATE']);
export const WORKSPACE_VISIBILITY = WorkspaceVisibilitySchema.enum;
export type WorkspaceVisibility = z.infer<typeof WorkspaceVisibilitySchema>;

// Asset types for icons, images, and styling
export const AssetTypeSchema = z.enum([
  'ICON',
  'IMAGE',
  'COVER',
  'THEME_PRESET',
]);
export const ASSET_TYPE = AssetTypeSchema.enum;
export type AssetType = z.infer<typeof AssetTypeSchema>;

// Template scope (personal or community-shared)
export const TemplateScopeSchema = z.enum(['PERSONAL', 'COMMUNITY']);
export const TEMPLATE_SCOPE = TemplateScopeSchema.enum;
export type TemplateScope = z.infer<typeof TemplateScopeSchema>;
