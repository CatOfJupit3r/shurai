import { useMutation } from '@tanstack/react-query';

import { toastORPCError } from '@~/components/toastifications';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

import type { WorkspaceQueryReturnType } from './use-workspace';

export const updateWorkspaceMutationOptions = tanstackRPC.workspaces.updateWorkspace.mutationOptions({
  async onMutate({ workspaceId, ...updates }, ctx) {
    const key = tanstackRPC.workspaces.getWorkspace.queryKey({ input: { workspaceId } });

    await ctx.client.cancelQueries({ queryKey: key });
    const previous = ctx.client.getQueryData<WorkspaceQueryReturnType>(key);

    ctx.client.setQueryData<WorkspaceQueryReturnType>(key, (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        ...updates,
        coverAssetId: updates.coverAssetId === null ? undefined : (updates.coverAssetId ?? oldData.coverAssetId),
      };
    });

    return { previous, workspaceId };
  },
  onError: (_error, { workspaceId }, context, ctx) => {
    if (context?.previous) {
      const key = tanstackRPC.workspaces.getWorkspace.queryKey({ input: { workspaceId } });
      ctx.client.setQueryData(key, context.previous);
    }
    toastORPCError('Failed to update workspace', _error);
  },
  onSuccess: (data, { workspaceId }, _context, ctx) => {
    const key = tanstackRPC.workspaces.getWorkspace.queryKey({ input: { workspaceId } });
    const listKey = tanstackRPC.workspaces.listWorkspaces.queryKey();

    ctx.client.setQueryData<WorkspaceQueryReturnType>(key, data);
    void ctx.client.invalidateQueries({ queryKey: listKey });
  },
});

export default function useUpdateWorkspace() {
  const { mutate: updateWorkspace, isPending } = useMutation(updateWorkspaceMutationOptions);

  return {
    updateWorkspace,
    isPending,
  };
}
