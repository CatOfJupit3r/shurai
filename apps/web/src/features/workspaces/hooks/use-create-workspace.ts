import { useMutation } from '@tanstack/react-query';

import { toastError, toastSuccess } from '@~/components/toastifications';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const createWorkspaceMutationOptions = tanstackRPC.workspaces.createWorkspace.mutationOptions({
  async onMutate(_variables, ctx) {
    const key = tanstackRPC.workspaces.listWorkspaces.queryKey();
    await ctx.client.cancelQueries({ queryKey: key });
  },
  onError: (_error, _variables, _context, ctx) => {
    const key = tanstackRPC.workspaces.listWorkspaces.queryKey();
    void ctx.client.invalidateQueries({ queryKey: key });
    toastError('Failed to create workspace');
  },
  onSuccess: (_data, _variables, _context, ctx) => {
    const key = tanstackRPC.workspaces.listWorkspaces.queryKey();
    void ctx.client.invalidateQueries({ queryKey: key });
    toastSuccess('Workspace created successfully');
  },
});

export default function useCreateWorkspace() {
  const { mutate: createWorkspace, isPending } = useMutation(createWorkspaceMutationOptions);

  return {
    createWorkspace,
    isPending,
  };
}
