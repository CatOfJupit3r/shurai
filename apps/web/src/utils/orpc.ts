import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { ContractRouterClient, InferContractRouterOutputs } from '@orpc/contract';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

import type { CONTRACT } from '@shurai/shared';

import { getBackendURL } from './ssr-helpers';

const getORPCClient = createIsomorphicFn()
  .client((): ContractRouterClient<typeof CONTRACT> => {
    const URL = getBackendURL('/rpc');
    const link = new RPCLink({
      url: URL,
      async fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        });
      },
    });

    return createORPCClient(link);
  })
  .server((): ContractRouterClient<typeof CONTRACT> => {
    const URL = getBackendURL('/rpc');
    const link = new RPCLink({
      url: URL,
      headers: () => getRequestHeaders(),
    });
    return createORPCClient(link);
  });
// I don't really want to add oRPC server to here too, so better keep it separate
// .server(() =>
//   createRouterClient(appRouter, {
//     context: async ({ req }) => {
//       return createContext({ context: req });
//     },
//   }),
// )

const client: ContractRouterClient<typeof CONTRACT> = getORPCClient();
export type ORPCOutputs = InferContractRouterOutputs<typeof CONTRACT>;
export default client;
