import { useQuery } from '@tanstack/react-query';

import type { ORPCOutputs } from '@~/utils/orpc';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export type PublicWorkspaceQueryReturnType = ORPCOutputs['workspaces']['getWorkspaceBySlug'];

export default function usePublicWorkspace(slug: string) {
  const {
    data: workspace,
    isPending,
    error,
  } = useQuery(
    tanstackRPC.workspaces.getWorkspaceBySlug.queryOptions({
      input: { slug },
    }),
  );

  return {
    workspace,
    isPending,
    error,
  };
}
