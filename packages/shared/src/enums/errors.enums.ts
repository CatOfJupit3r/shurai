const userErrorCodes = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_PROFILE_NOT_FOUND: 'USER_PROFILE_NOT_FOUND',
  USER_BADGE_NOT_ALLOWED: 'USER_BADGE_NOT_ALLOWED',
  BADGE_NOT_FOUND: 'BADGE_NOT_FOUND',
  INVALID_PUBLIC_CODE: 'INVALID_PUBLIC_CODE',
  PUBLIC_CODE_GENERATION_FAILED: 'PUBLIC_CODE_GENERATION_FAILED',
} as const;

const userErrorMessages = {
  [userErrorCodes.USER_NOT_FOUND]: 'User not found',
  [userErrorCodes.USER_PROFILE_NOT_FOUND]: 'User profile not found',
  [userErrorCodes.USER_BADGE_NOT_ALLOWED]: 'You do not have the required achievement to use this badge',
  [userErrorCodes.BADGE_NOT_FOUND]: 'Badge not found',
  [userErrorCodes.INVALID_PUBLIC_CODE]: 'Invalid public code',
  [userErrorCodes.PUBLIC_CODE_GENERATION_FAILED]: 'Failed to generate unique public code',
};

const workspaceErrorCodes = {
  WORKSPACE_NOT_FOUND: 'WORKSPACE_NOT_FOUND',
  WORKSPACE_ACCESS_DENIED: 'WORKSPACE_ACCESS_DENIED',
  WORKSPACE_TITLE_REQUIRED: 'WORKSPACE_TITLE_REQUIRED',
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  ITEM_ACCESS_DENIED: 'ITEM_ACCESS_DENIED',
  ITEM_PARENT_NOT_FOUND: 'ITEM_PARENT_NOT_FOUND',
  ITEM_CIRCULAR_REFERENCE: 'ITEM_CIRCULAR_REFERENCE',
  ASSET_NOT_FOUND: 'ASSET_NOT_FOUND',
  ASSET_ACCESS_DENIED: 'ASSET_ACCESS_DENIED',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  TEMPLATE_ACCESS_DENIED: 'TEMPLATE_ACCESS_DENIED',
  INVALID_WORKSPACE_VISIBILITY: 'INVALID_WORKSPACE_VISIBILITY',
  INVALID_ASSET_TYPE: 'INVALID_ASSET_TYPE',
  INVALID_TEMPLATE_SCOPE: 'INVALID_TEMPLATE_SCOPE',
} as const;

const workspaceErrorMessages = {
  [workspaceErrorCodes.WORKSPACE_NOT_FOUND]: 'Workspace not found',
  [workspaceErrorCodes.WORKSPACE_ACCESS_DENIED]: 'Access denied to workspace',
  [workspaceErrorCodes.WORKSPACE_TITLE_REQUIRED]: 'Workspace title is required',
  [workspaceErrorCodes.ITEM_NOT_FOUND]: 'Item not found',
  [workspaceErrorCodes.ITEM_ACCESS_DENIED]: 'Access denied to item',
  [workspaceErrorCodes.ITEM_PARENT_NOT_FOUND]: 'Parent item not found',
  [workspaceErrorCodes.ITEM_CIRCULAR_REFERENCE]: 'Circular reference detected in item hierarchy',
  [workspaceErrorCodes.ASSET_NOT_FOUND]: 'Asset not found',
  [workspaceErrorCodes.ASSET_ACCESS_DENIED]: 'Access denied to asset',
  [workspaceErrorCodes.TEMPLATE_NOT_FOUND]: 'Template not found',
  [workspaceErrorCodes.TEMPLATE_ACCESS_DENIED]: 'Access denied to template',
  [workspaceErrorCodes.INVALID_WORKSPACE_VISIBILITY]: 'Invalid workspace visibility',
  [workspaceErrorCodes.INVALID_ASSET_TYPE]: 'Invalid asset type',
  [workspaceErrorCodes.INVALID_TEMPLATE_SCOPE]: 'Invalid template scope',
};

export const errorCodes = {
  ...userErrorCodes,
  ...workspaceErrorCodes,
};

export type ErrorCodesType = (typeof errorCodes)[keyof typeof errorCodes];

export const errorMessages: Record<ErrorCodesType, string> = {
  ...userErrorMessages,
  ...workspaceErrorMessages,
};

const validateErrorCodesWithoutMessages = () => {
  if (Object.keys(errorCodes).length !== Object.keys(errorMessages).length) {
    const errorCodesWithoutMessages = Object.keys(errorCodes).filter((code) => !errorMessages[code as ErrorCodesType]);
    throw new Error(`Error codes without messages found: ${errorCodesWithoutMessages.join(', ')}`);
  }
};

validateErrorCodesWithoutMessages();
