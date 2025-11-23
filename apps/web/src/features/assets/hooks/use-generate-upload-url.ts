import { useMutation } from '@tanstack/react-query';

import { toastORPCError } from '@~/components/toastifications/create-jsx-toasts';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const generateUploadUrlMutationOptions = tanstackRPC.assets.generateUploadUrl.mutationOptions({
  onError: (_error) => {
    toastORPCError('Failed to generate upload URL', _error);
  },
});

export default function useGenerateUploadUrl() {
  const { mutate: generateUploadUrl, isPending, data } = useMutation(generateUploadUrlMutationOptions);

  return {
    generateUploadUrl,
    isPending,
    uploadData: data,
  };
}
