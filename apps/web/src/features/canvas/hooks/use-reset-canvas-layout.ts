import { useMutation } from '@tanstack/react-query';

import { toastORPCError } from '@~/components/toastifications';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

import type { CanvasLayoutQueryReturnType } from './use-canvas-layout';

export const resetCanvasLayoutMutationOptions = tanstackRPC.canvas.resetLayout.mutationOptions({
  async onMutate(variables, ctx) {
    const key = tanstackRPC.canvas.getLayout.queryKey({ input: { workspaceId: variables.workspaceId } });

    await ctx.client.cancelQueries({ queryKey: key });

    const previous = ctx.client.getQueryData<CanvasLayoutQueryReturnType>(key);

    // Optimistically clear the layout (remove from cache)
    ctx.client.removeQueries({ queryKey: key });

    return { previous };
  },
  onError: (_error, variables, context, ctx) => {
    const key = tanstackRPC.canvas.getLayout.queryKey({ input: { workspaceId: variables.workspaceId } });

    if (context?.previous) {
      ctx.client.setQueryData<CanvasLayoutQueryReturnType>(key, context.previous);
    } else {
      void ctx.client.invalidateQueries({ queryKey: key });
    }

    toastORPCError('Reset Failed', _error);
  },
  onSuccess: (_data, variables, _context, ctx) => {
    const key = tanstackRPC.canvas.getLayout.queryKey({ input: { workspaceId: variables.workspaceId } });

    // Invalidate to fetch the fresh reset state
    void ctx.client.invalidateQueries({ queryKey: key });
  },
});

export function useResetCanvasLayout() {
  const { mutate: resetLayout, isPending } = useMutation(resetCanvasLayoutMutationOptions);

  return {
    resetLayout,
    isPending,
  };
}
