import { useMutation } from '@tanstack/react-query';

import { toastORPCError } from '@~/components/toastifications';
import { isSimilar } from '@~/utils/query-helpers';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const updateTemplateMutationOptions = tanstackRPC.templates.updateTemplate.mutationOptions({
  onError: (_error) => {
    toastORPCError('Failed to update template', _error);
  },
  onSuccess: (_data, _variables, _context, ctx) => {
    void ctx.client.invalidateQueries({
      predicate: (query) => isSimilar(query.queryKey, tanstackRPC.templates.key()),
    });
  },
});

export default function useUpdateTemplate() {
  const { mutate: updateTemplate, isPending } = useMutation(updateTemplateMutationOptions);

  return {
    updateTemplate,
    isPending,
  };
}
