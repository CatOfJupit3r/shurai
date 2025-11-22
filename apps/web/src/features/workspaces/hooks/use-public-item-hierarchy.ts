import { useQuery } from '@tanstack/react-query';

import type { ORPCOutputs } from '@~/utils/orpc';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export type PublicItemHierarchyQueryReturnType = ORPCOutputs['items']['getPublicItemHierarchy'];

export default function usePublicItemHierarchy(slug: string) {
  const {
    data: items,
    isPending,
    error,
  } = useQuery(
    tanstackRPC.items.getPublicItemHierarchy.queryOptions({
      input: { slug },
    }),
  );

  return {
    items: items ?? [],
    isPending,
    error,
  };
}
