import { useQuery } from '@tanstack/react-query';

import type { AssetType } from '@shurai/shared';

import type { ORPCOutputs } from '@~/utils/orpc';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export type AssetsListQueryReturnType = ORPCOutputs['assets']['listAssets'];

export default function useAssetsList(type?: AssetType) {
  const {
    data: assets,
    isPending,
    error,
  } = useQuery(
    tanstackRPC.assets.listAssets.queryOptions({
      input: type ? { type } : {},
    }),
  );

  return {
    assets: assets ?? [],
    isPending,
    error,
  };
}
