import { useMutation } from '@tanstack/react-query';

import { toastORPCError } from '@~/components/toastifications';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const moveItemMutationOptions = tanstackRPC.items.moveItem.mutationOptions({
  onError: (_error) => {
    toastORPCError('Failed to move item', _error);
  },
  onSuccess: (movedItem, _variables, _context, ctx) => {
    const key = tanstackRPC.items.getItemHierarchy.queryKey({ input: { workspaceId: movedItem.workspaceId } });
    void ctx.client.invalidateQueries({ queryKey: key });
  },
});

export default function useMoveItem() {
  const { mutate: moveItem, isPending } = useMutation(moveItemMutationOptions);

  return {
    moveItem,
    isPending,
  };
}
