import { useMutation } from '@tanstack/react-query';

import { toastError, toastSuccess } from '@~/components/toastifications/create-jsx-toasts';
import type { ORPCOutputs } from '@~/utils/orpc';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export type AssetsListQueryReturnType = ORPCOutputs['assets']['listAssets'];
export type AssetQueryReturnType = ORPCOutputs['assets']['getAsset'];

export const updateAssetMutationOptions = tanstackRPC.assets.updateAsset.mutationOptions({
  onMutate: async ({ assetId, ...updates }, ctx) => {
    const assetKey = tanstackRPC.assets.getAsset.queryKey({ input: { assetId } });
    const allKey = tanstackRPC.assets.listAssets.queryKey({ input: {} });

    await ctx.client.cancelQueries({ queryKey: assetKey });
    await ctx.client.cancelQueries({ queryKey: allKey });

    const previousAsset = ctx.client.getQueryData(assetKey);
    const previousAll = ctx.client.getQueryData(allKey);

    ctx.client.setQueryData<AssetQueryReturnType>(assetKey, (old) => (old ? { ...old, ...updates } : old));

    ctx.client.setQueryData<AssetsListQueryReturnType>(allKey, (old) =>
      old
        ? old.map((asset) =>
            asset._id === assetId
              ? {
                  ...asset,
                  ...updates,
                }
              : asset,
          )
        : old,
    );

    return { previousAsset, previousAll, assetKey, allKey };
  },
  onError: (_error, _variables, context, ctx) => {
    if (context?.previousAsset) {
      ctx.client.setQueryData(context.assetKey, context.previousAsset);
    }
    if (context?.previousAll) {
      ctx.client.setQueryData(context.allKey, context.previousAll);
    }
    toastError('Failed to update asset', 'Please try again later');
  },
  onSuccess: (updatedAsset, _variables, context, ctx) => {
    ctx.client.setQueryData<AssetQueryReturnType>(context.assetKey, updatedAsset);
    ctx.client.setQueryData<AssetsListQueryReturnType>(context.allKey, (old) =>
      old ? old.map((asset) => (asset._id === updatedAsset._id ? updatedAsset : asset)) : old,
    );
    toastSuccess('Asset updated successfully');
  },
});

export default function useUpdateAsset() {
  const { mutate: updateAsset, isPending } = useMutation(updateAssetMutationOptions);

  return {
    updateAsset,
    isPending,
  };
}
