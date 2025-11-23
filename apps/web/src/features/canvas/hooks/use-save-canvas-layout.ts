import { useMutation } from '@tanstack/react-query';

import { toastORPCError } from '@~/components/toastifications';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

import type { CanvasLayoutQueryReturnType } from './use-canvas-layout';

export const saveCanvasLayoutMutationOptions = tanstackRPC.canvas.saveLayout.mutationOptions({
  async onMutate(variables, ctx) {
    const key = tanstackRPC.canvas.getLayout.queryKey({ input: { workspaceId: variables.workspaceId } });

    await ctx.client.cancelQueries({ queryKey: key });

    const previous = ctx.client.getQueryData<CanvasLayoutQueryReturnType>(key);

    // Note: We don't do optimistic updates for complex nested structures
    // Just cancel queries and let onSuccess handle the update
    return { previous };
  },
  onError: (_error, variables, context, ctx) => {
    const key = tanstackRPC.canvas.getLayout.queryKey({ input: { workspaceId: variables.workspaceId } });

    if (context?.previous) {
      ctx.client.setQueryData<CanvasLayoutQueryReturnType>(key, context.previous);
    } else {
      void ctx.client.invalidateQueries({ queryKey: key });
    }

    toastORPCError('Save Failed', _error);
  },
  onSuccess: (data, variables, _context, ctx) => {
    const key = tanstackRPC.canvas.getLayout.queryKey({ input: { workspaceId: variables.workspaceId } });

    ctx.client.setQueryData<CanvasLayoutQueryReturnType>(key, data);
  },
});

export function useSaveCanvasLayout() {
  const { mutate: saveLayout, isPending } = useMutation(saveCanvasLayoutMutationOptions);

  return {
    saveLayout,
    isPending,
  };
}
