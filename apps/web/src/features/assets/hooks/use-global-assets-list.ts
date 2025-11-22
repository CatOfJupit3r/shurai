import { useQuery } from '@tanstack/react-query';

import type { ORPCOutputs } from '@~/utils/orpc';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export type GlobalAssetsListQueryReturnType = ORPCOutputs['assets']['listGlobalAssets'];

export default function useGlobalAssetsList(type?: 'ICON' | 'IMAGE' | 'COVER' | 'THEME_PRESET') {
  const {
    data: assets,
    isPending,
    error,
  } = useQuery(
    tanstackRPC.assets.listGlobalAssets.queryOptions({
      input: type ? { type } : {},
    }),
  );

  return {
    assets: assets ?? [],
    isPending,
    error,
  };
}
