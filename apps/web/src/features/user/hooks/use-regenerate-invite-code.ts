import { useMutation } from '@tanstack/react-query';

import { toastORPCError } from '@~/components/toastifications';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const regeneratePublicCodeMutationOptions = tanstackRPC.user.regeneratePublicCode.mutationOptions({
  onSuccess: (_data, _variables, _context, ctx) => {
    void ctx.client.invalidateQueries({ queryKey: tanstackRPC.user.getUserProfile.queryKey() });
  },
  onError: (_error) => {
    toastORPCError('Failed to regenerate invite code', _error);
  },
});

export function useRegeneratePublicCode() {
  const { mutate: regeneratePublicCode, isPending } = useMutation(regeneratePublicCodeMutationOptions);

  return {
    regeneratePublicCode,
    isPending,
  };
}
