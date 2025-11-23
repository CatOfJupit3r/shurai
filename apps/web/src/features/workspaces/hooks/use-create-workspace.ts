import { useMutation } from '@tanstack/react-query';

import { toastORPCError } from '@~/components/toastifications';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const createWorkspaceMutationOptions = tanstackRPC.workspaces.createWorkspace.mutationOptions({
  async onMutate(_variables, ctx) {
    const key = tanstackRPC.workspaces.listWorkspaces.queryKey();
    await ctx.client.cancelQueries({ queryKey: key });
  },
  onError: (_error, _variables, _context, ctx) => {
    const key = tanstackRPC.workspaces.listWorkspaces.queryKey();
    void ctx.client.invalidateQueries({ queryKey: key });
    toastORPCError('Failed to create workspace', _error);
  },
  onSuccess: (_data, _variables, _context, ctx) => {
    const key = tanstackRPC.workspaces.listWorkspaces.queryKey();
    void ctx.client.invalidateQueries({ queryKey: key });
  },
});

export default function useCreateWorkspace() {
  const { mutate: createWorkspace, isPending } = useMutation(createWorkspaceMutationOptions);

  return {
    createWorkspace,
    isPending,
  };
}
