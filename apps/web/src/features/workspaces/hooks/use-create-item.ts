import { useMutation } from '@tanstack/react-query';

import { toastError, toastSuccess } from '@~/components/toastifications';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const createItemMutationOptions = tanstackRPC.items.createItem.mutationOptions({
  async onMutate({ workspaceId }, ctx) {
    const key = tanstackRPC.items.getItemHierarchy.queryKey({ input: { workspaceId } });
    await ctx.client.cancelQueries({ queryKey: key });
  },
  onError: (_error, { workspaceId }, _context, ctx) => {
    const key = tanstackRPC.items.getItemHierarchy.queryKey({ input: { workspaceId } });
    void ctx.client.invalidateQueries({ queryKey: key });
    toastError('Failed to create item');
  },
  onSuccess: (_data, { workspaceId }, _context, ctx) => {
    const key = tanstackRPC.items.getItemHierarchy.queryKey({ input: { workspaceId } });
    void ctx.client.invalidateQueries({ queryKey: key });
    toastSuccess('Item created');
  },
});

export default function useCreateItem() {
  const { mutate: createItem, isPending } = useMutation(createItemMutationOptions);

  return {
    createItem,
    isPending,
  };
}
