import { useQuery } from '@tanstack/react-query';

import type { ORPCOutputs } from '@~/utils/orpc';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export type AssetQueryReturnType = ORPCOutputs['assets']['getAsset'];

export default function useAsset(assetId: string) {
  const {
    data: asset,
    isPending,
    error,
  } = useQuery(
    tanstackRPC.assets.getAsset.queryOptions({
      input: { assetId },
    }),
  );

  return {
    asset,
    isPending,
    error,
  };
}
