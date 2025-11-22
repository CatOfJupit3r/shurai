import { useMutation } from '@tanstack/react-query';

import { toastError, toastSuccess } from '@~/components/toastifications/create-jsx-toasts';
import type { ORPCOutputs } from '@~/utils/orpc';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export type AssetsListQueryReturnType = ORPCOutputs['assets']['listAssets'];

export const createAssetMutationOptions = tanstackRPC.assets.createAsset.mutationOptions({
  onMutate: async (input, ctx) => {
    const allKey = tanstackRPC.assets.listAssets.queryKey({ input: {} });
    const typeKey = input.type ? tanstackRPC.assets.listAssets.queryKey({ input: { type: input.type } }) : null;

    await ctx.client.cancelQueries({ queryKey: allKey });
    if (typeKey) await ctx.client.cancelQueries({ queryKey: typeKey });

    const previous = {
      all: ctx.client.getQueryData(allKey),
      typed: typeKey ? ctx.client.getQueryData(typeKey) : null,
    };

    return { previous, allKey, typeKey };
  },
  onError: (_error, _variables, context, ctx) => {
    if (context?.previous.all) {
      ctx.client.setQueryData(context.allKey, context.previous.all);
    }
    if (context?.previous.typed && context.typeKey) {
      ctx.client.setQueryData(context.typeKey, context.previous.typed);
    }
    toastError('Failed to create asset', 'Please try again later');
  },
  onSuccess: (newAsset, _variables, context, ctx) => {
    ctx.client.setQueryData<AssetsListQueryReturnType>(context.allKey, (old) =>
      old ? [newAsset, ...old] : [newAsset],
    );
    if (context.typeKey) {
      ctx.client.setQueryData<AssetsListQueryReturnType>(context.typeKey, (old) =>
        old ? [newAsset, ...old] : [newAsset],
      );
    }
    toastSuccess('Asset created successfully');
  },
});

export default function useCreateAsset() {
  const { mutate: createAsset, isPending } = useMutation(createAssetMutationOptions);

  return {
    createAsset,
    isPending,
  };
}
