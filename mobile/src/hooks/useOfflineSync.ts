/**
 * Offline Sync Hook
 * 
 * Automatically syncs request queue when network comes back online.
 * Provides status updates for queued requests.
 */

import { useEffect, useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { requestQueue, QueuedRequest } from '@/utils/requestQueue';

export const useOfflineSync = () => {
  const { isConnected } = useNetworkStatus();
  const [queuedRequests, setQueuedRequests] = useState<QueuedRequest[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Subscribe to queue changes
  useEffect(() => {
    const unsubscribe = requestQueue.subscribe((queue) => {
      setQueuedRequests(queue);
    });

    // Load initial queue
    setQueuedRequests(requestQueue.getAll());

    return unsubscribe;
  }, []);

  // Auto-process queue when connection restored
  useEffect(() => {
    if (isConnected && queuedRequests.length > 0 && !isSyncing) {
      setIsSyncing(true);
      requestQueue.processQueue().finally(() => {
        setIsSyncing(false);
      });
    }
  }, [isConnected, queuedRequests.length, isSyncing]);

  return {
    queuedRequests,
    queueSize: queuedRequests.length,
    isSyncing,
    clearQueue: () => requestQueue.clear(),
  };
};
