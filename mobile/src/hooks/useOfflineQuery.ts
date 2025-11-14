/**
 * Offline-Aware Query Hook
 * 
 * Extends React Query with offline caching support.
 * Automatically caches successful queries and returns cached data when offline.
 * 
 * Usage:
 * const { data, isOffline } = useOfflineQuery({
 *   queryKey: '/api/mobile/feed',
 *   queryFn: () => apiClient.getFeed(),
 *   cacheFunction: cacheFeedPosts,
 *   getCachedFunction: getCachedFeedPosts
 * });
 */

import { useQuery, UseQueryResult, QueryFunction } from '@tanstack/react-query';
import { useNetworkStatus } from './useNetworkStatus';
import { useEffect, useState } from 'react';

interface UseOfflineQueryOptions<T> {
  queryKey: string | string[];
  queryFn: QueryFunction<T>;
  cacheFunction: (data: T) => Promise<void>;
  getCachedFunction: () => Promise<T | null>;
  enabled?: boolean;
}

export const useOfflineQuery = <T,>({
  queryKey,
  queryFn,
  cacheFunction,
  getCachedFunction,
  enabled = true,
}: UseOfflineQueryOptions<T>): UseQueryResult<T, Error> & { isOffline: boolean } => {
  const { isConnected } = useNetworkStatus();
  const [cachedData, setCachedData] = useState<T | null>(null);

  // Load cached data on mount
  useEffect(() => {
    getCachedFunction().then(setCachedData);
  }, []);

  // Standard React Query with queryFn
  const query = useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    enabled: enabled && isConnected,
  });

  // Cache successful data
  useEffect(() => {
    if (query.data && query.isSuccess) {
      cacheFunction(query.data);
    }
  }, [query.data, query.isSuccess]);

  // Return cached data if offline and no fresh data available
  const dataToReturn = !isConnected && !query.data ? cachedData : query.data;

  return {
    ...query,
    data: dataToReturn as T,
    isOffline: !isConnected,
  };
};
