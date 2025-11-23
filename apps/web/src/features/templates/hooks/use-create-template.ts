import { useMutation } from '@tanstack/react-query';

import { toastORPCError } from '@~/components/toastifications';
import { isExactMatch } from '@~/utils/query-helpers';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const createTemplateMutationOptions = tanstackRPC.templates.createTemplate.mutationOptions({
  onError: (_error) => {
    toastORPCError('Failed to create template', _error);
  },
  onSuccess: (_data, _variables, _context, ctx) => {
    void ctx.client.invalidateQueries({
      predicate: (query) => isExactMatch(query.queryKey, tanstackRPC.templates.listTemplates.key()),
    });
  },
});

export default function useCreateTemplate() {
  const { mutate: createTemplate, isPending } = useMutation(createTemplateMutationOptions);

  return {
    createTemplate,
    isPending,
  };
}
