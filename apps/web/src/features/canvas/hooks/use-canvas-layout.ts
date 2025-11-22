import { useQuery } from '@tanstack/react-query';

import type { ORPCOutputs } from '@~/utils/orpc';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export type CanvasLayoutQueryReturnType = ORPCOutputs['canvas']['getLayout'];

export function useCanvasLayout(workspaceId: string) {
  const { data, isPending, error, refetch } = useQuery(
    tanstackRPC.canvas.getLayout.queryOptions({
      input: { workspaceId },
    }),
  );

  return {
    layout: data,
    isPending,
    error,
    refetch,
  };
}
