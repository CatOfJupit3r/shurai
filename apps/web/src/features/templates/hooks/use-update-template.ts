import { useMutation } from '@tanstack/react-query';

import { toastError, toastSuccess } from '@~/components/toastifications';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const updateTemplateMutationOptions = tanstackRPC.templates.updateTemplate.mutationOptions({
  onError: (_error) => {
    toastError('Failed to update template');
  },
  onSuccess: (_data, _variables, _context, ctx) => {
    void ctx.client.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'templates',
    });
    toastSuccess('Template updated successfully');
  },
});

export default function useUpdateTemplate() {
  const { mutate: updateTemplate, isPending } = useMutation(updateTemplateMutationOptions);

  return {
    updateTemplate,
    isPending,
  };
}
