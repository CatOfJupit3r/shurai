import { useMutation } from '@tanstack/react-query';

import { toastError } from '@~/components/toastifications/create-jsx-toasts';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export const generateUploadUrlMutationOptions = tanstackRPC.assets.generateUploadUrl.mutationOptions({
  onError: () => {
    toastError('Failed to generate upload URL', 'Please try again later');
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
