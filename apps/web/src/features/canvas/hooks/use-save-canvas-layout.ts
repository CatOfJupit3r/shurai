import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { tanstackRPC } from '@~/utils/tanstack-orpc';

import type { CanvasLayoutQueryReturnType } from './use-canvas-layout';

export const saveCanvasLayoutMutationOptions = tanstackRPC.canvas.saveLayout.mutationOptions({
  onError: (_error, variables, _context, ctx) => {
    const key = tanstackRPC.canvas.getLayout.queryKey({ input: { workspaceId: variables.workspaceId } });

    void ctx.client.invalidateQueries({ queryKey: key });

    toast.error('Failed to save canvas layout');
  },
  onSuccess: (data, variables, _context, ctx) => {
    const key = tanstackRPC.canvas.getLayout.queryKey({ input: { workspaceId: variables.workspaceId } });

    ctx.client.setQueryData<CanvasLayoutQueryReturnType>(key, data);
    toast.success('Canvas layout saved');
  },
});

export function useSaveCanvasLayout() {
  const { mutate: saveLayout, isPending } = useMutation(saveCanvasLayoutMutationOptions);

  return {
    saveLayout,
    isPending,
  };
}
