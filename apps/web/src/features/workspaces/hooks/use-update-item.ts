import { useMutation } from '@tanstack/react-query';

import { toastError, toastSuccess } from '@~/components/toastifications';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const updateItemMutationOptions = tanstackRPC.items.updateItem.mutationOptions({
  onError: (_error) => {
    toastError('Failed to update item');
  },
  onSuccess: (updatedItem, _variables, _context, ctx) => {
    const key = tanstackRPC.items.getItemHierarchy.queryKey({ input: { workspaceId: updatedItem.workspaceId } });
    void ctx.client.invalidateQueries({ queryKey: key });
    toastSuccess('Item updated');
  },
});

export default function useUpdateItem() {
  const { mutate: updateItem, isPending } = useMutation(updateItemMutationOptions);

  return {
    updateItem,
    isPending,
  };
}
