import { useMutation } from '@tanstack/react-query';

import { toastError, toastSuccess } from '@~/components/toastifications';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const deleteItemMutationOptions = tanstackRPC.items.deleteItem.mutationOptions({
  onError: (_error) => {
    toastError('Failed to delete item');
  },
  onSuccess: (_data, _variables, _context, ctx) => {
    // Invalidate all item hierarchy queries
    void ctx.client.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'items' && query.queryKey[1] === 'getItemHierarchy',
    });
    toastSuccess('Item deleted');
  },
});

export default function useDeleteItem() {
  const { mutate: deleteItem, isPending } = useMutation(deleteItemMutationOptions);

  return {
    deleteItem,
    isPending,
  };
}
