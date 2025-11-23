import { useMutation } from '@tanstack/react-query';

import { toastORPCError } from '@~/components/toastifications';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const applyTemplateMutationOptions = tanstackRPC.templates.applyTemplate.mutationOptions({
  async onMutate({ workspaceId }, ctx) {
    const key = tanstackRPC.items.getItemHierarchy.queryKey({ input: { workspaceId } });
    await ctx.client.cancelQueries({ queryKey: key });
  },
  onError: (_error, { workspaceId }, _context, ctx) => {
    const key = tanstackRPC.items.getItemHierarchy.queryKey({ input: { workspaceId } });
    void ctx.client.invalidateQueries({ queryKey: key });
    toastORPCError('Failed to apply template', _error);
  },
  onSuccess: (_data, { workspaceId }, _context, ctx) => {
    const key = tanstackRPC.items.getItemHierarchy.queryKey({ input: { workspaceId } });
    void ctx.client.invalidateQueries({ queryKey: key });
  },
});

export default function useApplyTemplate() {
  const { mutate: applyTemplate, isPending } = useMutation(applyTemplateMutationOptions);

  return {
    applyTemplate,
    isPending,
  };
}
