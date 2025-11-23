import { useBlocker } from '@tanstack/react-router';
import { useEffect } from 'react';

interface iUseCanvasNavigationGuardOptions {
  isDirty: boolean;
  enabled?: boolean;
  message?: string;
}

/**
 * Hook to block navigation when there are unsaved canvas changes
 * Shows a confirmation dialog before allowing navigation away
 *
 * @param isDirty - Whether there are unsaved changes
 * @param enabled - Whether the navigation guard is enabled (default: true)
 * @param message - Custom confirmation message
 */
export function useCanvasNavigationGuard({
  isDirty,
  enabled = true,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: iUseCanvasNavigationGuardOptions) {
  // Use TanStack Router's useBlocker to prevent navigation
  useBlocker({
    condition: enabled && isDirty,
    blockerFn: () =>
      // eslint-disable-next-line no-alert
      window.confirm(message),
  });

  // Also handle browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (enabled && isDirty) {
        e.preventDefault();
        // Modern browsers ignore the custom message and show their own
        e.returnValue = message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, isDirty, message]);
}
