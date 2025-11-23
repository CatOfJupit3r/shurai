import { QueryCache, QueryClient } from '@tanstack/react-query';

export const QUERY_REFETCH_INTERVALS = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // stale time indicates how long a query can be cached for before it's considered stale
      staleTime: QUERY_REFETCH_INTERVALS.FIVE_MINUTES, // 5 minutes
      // refetchInterval indicates how long to keep a query in cache before checking with the server
      refetchInterval: QUERY_REFETCH_INTERVALS.THIRTY_MINUTES, // 30 minutes
    },
  },
  queryCache: new QueryCache(),
});
