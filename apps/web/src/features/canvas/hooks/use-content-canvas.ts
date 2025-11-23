import { useQuery } from '@tanstack/react-query';

import type { ORPCOutputs } from '@~/utils/orpc';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export type ContentCanvasQueryReturnType = ORPCOutputs['canvas']['getContentCanvas'];

export function useContentCanvas(contentCanvasId: string | null) {
  const { data, isPending, error, refetch } = useQuery({
    ...tanstackRPC.canvas.getContentCanvas.queryOptions({
      input: { contentCanvasId: contentCanvasId ?? '' },
    }),
    enabled: !!contentCanvasId,
  });

  return {
    contentCanvas: data,
    isPending,
    error,
    refetch,
  };
}
