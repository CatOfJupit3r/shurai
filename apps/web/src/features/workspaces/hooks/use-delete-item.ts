import { useMutation } from '@tanstack/react-query';

import { toastORPCError } from '@~/components/toastifications';
import { isExactMatch } from '@~/utils/query-helpers';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const deleteItemMutationOptions = tanstackRPC.items.deleteItem.mutationOptions({
  onError: (_error) => {
    toastORPCError('Failed to delete item', _error);
  },
  onSuccess: (_data, _variables, _context, ctx) => {
    // Invalidate all item hierarchy queries
    void ctx.client.invalidateQueries({
      predicate: (query) =>
        isExactMatch(query.queryKey, tanstackRPC.items.getItemHierarchy.key()) ||
        isExactMatch(query.queryKey, tanstackRPC.items.listItems.key()),
    });
  },
});

export default function useDeleteItem() {
  const { mutate: deleteItem, isPending } = useMutation(deleteItemMutationOptions);

  return {
    deleteItem,
    isPending,
  };
}
