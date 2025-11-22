import { useQuery } from '@tanstack/react-query';

import type { ORPCOutputs } from '@~/utils/orpc';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export type WorkspaceQueryReturnType = ORPCOutputs['workspaces']['getWorkspace'];

export default function useWorkspace(workspaceId: string) {
  const {
    data: workspace,
    isPending,
    error,
  } = useQuery(
    tanstackRPC.workspaces.getWorkspace.queryOptions({
      input: { workspaceId },
    }),
  );

  return {
    workspace,
    isPending,
    error,
  };
}
