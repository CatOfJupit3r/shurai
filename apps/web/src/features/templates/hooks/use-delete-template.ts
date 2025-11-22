import { useMutation } from '@tanstack/react-query';

import { toastError, toastSuccess } from '@~/components/toastifications';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const deleteTemplateMutationOptions = tanstackRPC.templates.deleteTemplate.mutationOptions({
  onError: (_error) => {
    toastError('Failed to delete template');
  },
  onSuccess: (_data, _variables, _context, ctx) => {
    void ctx.client.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'templates',
    });
    toastSuccess('Template deleted successfully');
  },
});

export default function useDeleteTemplate() {
  const { mutate: deleteTemplate, isPending } = useMutation(deleteTemplateMutationOptions);

  return {
    deleteTemplate,
    isPending,
  };
}
