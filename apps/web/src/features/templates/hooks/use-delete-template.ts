import { useMutation } from '@tanstack/react-query';

import { toastORPCError } from '@~/components/toastifications';
import { isSimilar } from '@~/utils/query-helpers';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const deleteTemplateMutationOptions = tanstackRPC.templates.deleteTemplate.mutationOptions({
  onError: (_error) => {
    toastORPCError('Failed to delete template', _error);
  },
  onSuccess: (_data, _variables, _context, ctx) => {
    void ctx.client.invalidateQueries({
      predicate: (query) => isSimilar(query.queryKey, tanstackRPC.templates.key()),
    });
  },
});

export default function useDeleteTemplate() {
  const { mutate: deleteTemplate, isPending } = useMutation(deleteTemplateMutationOptions);

  return {
    deleteTemplate,
    isPending,
  };
}
