import { useQuery } from '@tanstack/react-query';

import type { ORPCOutputs } from '@~/utils/orpc';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export type WorkspacesListQueryReturnType = ORPCOutputs['workspaces']['listWorkspaces'];

export default function useWorkspacesList() {
  const { data: workspaces, isPending, error } = useQuery(tanstackRPC.workspaces.listWorkspaces.queryOptions());

  return {
    workspaces: workspaces ?? [],
    isPending,
    error,
  };
}
