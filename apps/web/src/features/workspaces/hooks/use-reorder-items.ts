import { useMutation } from '@tanstack/react-query';

import { toastORPCError } from '@~/components/toastifications';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const reorderItemsMutationOptions = tanstackRPC.items.reorderItems.mutationOptions({
  async onMutate({ workspaceId }, ctx) {
    const key = tanstackRPC.items.getItemHierarchy.queryKey({ input: { workspaceId } });
    await ctx.client.cancelQueries({ queryKey: key });
  },
  onError: (_error, { workspaceId }, _context, ctx) => {
    const key = tanstackRPC.items.getItemHierarchy.queryKey({ input: { workspaceId } });
    void ctx.client.invalidateQueries({ queryKey: key });
    toastORPCError('Failed to reorder items', _error);
  },
  onSuccess: (_data, { workspaceId }, _context, ctx) => {
    const key = tanstackRPC.items.getItemHierarchy.queryKey({ input: { workspaceId } });
    void ctx.client.invalidateQueries({ queryKey: key });
  },
});

export default function useReorderItems() {
  const { mutate: reorderItems, isPending } = useMutation(reorderItemsMutationOptions);

  return {
    reorderItems,
    isPending,
  };
}
