import { useQuery } from '@tanstack/react-query';

import type { TemplateScope } from '@shurai/shared';

import type { ORPCOutputs } from '@~/utils/orpc';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

export type TemplatesListQueryReturnType = ORPCOutputs['templates']['listTemplates'];

export default function useTemplatesList(scope?: TemplateScope) {
  const {
    data: templates,
    isPending,
    error,
  } = useQuery(
    tanstackRPC.templates.listTemplates.queryOptions({
      input: { scope },
    }),
  );

  return {
    templates: templates ?? [],
    isPending,
    error,
  };
}
