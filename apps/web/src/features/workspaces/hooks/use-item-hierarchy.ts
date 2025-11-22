import { useQuery } from '@tanstack/react-query';

import type { ORPCOutputs } from '@~/utils/orpc';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export type ItemHierarchyQueryReturnType = ORPCOutputs['items']['getItemHierarchy'];

export default function useItemHierarchy(workspaceId: string) {
  const {
    data: items,
    isPending,
    error,
  } = useQuery(
    tanstackRPC.items.getItemHierarchy.queryOptions({
      input: { workspaceId },
    }),
  );

  return {
    items: items ?? [],
    isPending,
    error,
  };
}
