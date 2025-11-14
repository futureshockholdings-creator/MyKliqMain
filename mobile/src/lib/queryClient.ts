import { QueryClient } from '@tanstack/react-query';
import { errorReporting } from '../utils/errorReporting';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (error) => {
        if (error instanceof Error) {
          errorReporting.logError(error, undefined, false);
        }
      },
    },
    mutations: {
      retry: false,
      onError: (error) => {
        if (error instanceof Error) {
          errorReporting.logError(error, undefined, false);
        }
      },
    },
  },
});
