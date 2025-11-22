import { useQuery } from '@tanstack/react-query';

import type { ORPCOutputs } from '@~/utils/orpc';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export type TemplateQueryReturnType = ORPCOutputs['templates']['getTemplate'];

export default function useTemplate(templateId: string) {
  const {
    data: template,
    isPending,
    error,
  } = useQuery(
    tanstackRPC.templates.getTemplate.queryOptions({
      input: { templateId },
    }),
  );

  return {
    template,
    isPending,
    error,
  };
}
