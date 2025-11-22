import { useMutation } from '@tanstack/react-query';

import { toastError, toastSuccess } from '@~/components/toastifications';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const createTemplateMutationOptions = tanstackRPC.templates.createTemplate.mutationOptions({
  onError: (_error) => {
    toastError('Failed to create template');
  },
  onSuccess: (_data, _variables, _context, ctx) => {
    void ctx.client.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'templates' && query.queryKey[1] === 'listTemplates',
    });
    toastSuccess('Template created successfully');
  },
});

export default function useCreateTemplate() {
  const { mutate: createTemplate, isPending } = useMutation(createTemplateMutationOptions);

  return {
    createTemplate,
    isPending,
  };
}
