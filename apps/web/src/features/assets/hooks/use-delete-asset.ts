import { useMutation } from '@tanstack/react-query';

import { toastORPCError } from '@~/components/toastifications/create-jsx-toasts';
import type { ORPCOutputs } from '@~/utils/orpc';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export type AssetsListQueryReturnType = ORPCOutputs['assets']['listAssets'];

export const deleteAssetMutationOptions = tanstackRPC.assets.deleteAsset.mutationOptions({
  onMutate: async ({ assetId }, ctx) => {
    const allKey = tanstackRPC.assets.listAssets.queryKey({ input: {} });

    await ctx.client.cancelQueries({ queryKey: allKey });

    const previous = ctx.client.getQueryData(allKey);

    ctx.client.setQueryData<AssetsListQueryReturnType>(allKey, (old) =>
      old ? old.filter((asset) => asset._id !== assetId) : old,
    );

    return { previous, allKey };
  },
  onError: (_error, _variables, context, ctx) => {
    if (context?.previous) {
      ctx.client.setQueryData(context.allKey, context.previous);
    }
    toastORPCError('Failed to delete asset', _error);
  },
  onSettled: (_data, _error, _variables, context, ctx) => {
    if (context) {
      void ctx.client.invalidateQueries({ queryKey: context.allKey });
    }
  },
});

export default function useDeleteAsset() {
  const { mutate: deleteAsset, isPending } = useMutation(deleteAssetMutationOptions);

  return {
    deleteAsset,
    isPending,
  };
}
