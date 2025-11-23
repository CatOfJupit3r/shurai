import { useCopyToClipboard } from '@uidotdev/usehooks';
import { useEffect, useState } from 'react';
import { LuCheck, LuCopy } from 'react-icons/lu';

import { Button } from '@~/components/ui/button';
import type { iButtonProps } from '@~/components/ui/button';

import { toastError, toastSuccess } from './toastifications';

interface iCopyButtonProps extends Omit<iButtonProps, 'onClick' | 'value'> {
  value: string;
  successMessage?: string;
  errorMessage?: string;
}

export function CopyButton({
  value,
  successMessage = 'Copied to clipboard',
  errorMessage = 'Failed to copy',
  disabled = false,
  children,
}: iCopyButtonProps) {
  const [copiedText, copyToClipboard] = useCopyToClipboard();
  const [isShowingFeedback, setIsShowingFeedback] = useState(false);

  const isCopied = copiedText === value && isShowingFeedback;

  const handleCopy = async () => {
    try {
      await copyToClipboard(value);
      setIsShowingFeedback(true);
      toastSuccess(successMessage);
    } catch {
      toastError(errorMessage);
    }
  };

  useEffect(() => {
    if (isShowingFeedback) {
      const timer = setTimeout(() => {
        setIsShowingFeedback(false);
      }, 2000);

      return () => {
        clearTimeout(timer);
      };
    }

    return undefined;
  }, [isShowingFeedback]);

  return (
    <Button size="icon" onClick={handleCopy} {...(isCopied ? { disabled: true } : { disabled })}>
      {isCopied ? <LuCheck className="h-4 w-4" /> : <LuCopy className="h-4 w-4" />} {children}
    </Button>
  );
}
