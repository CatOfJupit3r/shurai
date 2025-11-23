import { useEffect } from 'react';

import { useDebounce } from '@~/hooks/use-debounce';

interface iUseCanvasAutosaveOptions {
  isDirty: boolean;
  save: () => void;
  isSaving: boolean;
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Hook for auto-saving canvas changes with debouncing
 * Automatically saves the canvas after a period of inactivity
 *
 * @param isDirty - Whether there are unsaved changes
 * @param save - Function to call to save changes
 * @param isSaving - Whether a save is currently in progress
 * @param enabled - Whether autosave is enabled (default: true)
 * @param debounceMs - Debounce delay in milliseconds (default: 3000)
 */
export function useCanvasAutosave({
  isDirty,
  save,
  isSaving,
  enabled = true,
  debounceMs = 3000,
}: iUseCanvasAutosaveOptions) {
  const autoSafeFn = useDebounce(() => {
    save();
  }, debounceMs);

  useEffect(() => {
    // Only schedule autosave if:
    // 1. Autosave is enabled
    // 2. There are dirty changes
    // 3. Not currently saving
    if (!enabled || !isDirty || isSaving) return;
    autoSafeFn();
  }, [isDirty, autoSafeFn, isSaving, enabled, debounceMs]);
}
