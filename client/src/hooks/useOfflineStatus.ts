import { useState, useEffect, useSyncExternalStore } from 'react';
import { offlineStore } from '@/lib/offlineStore';

export function useOfflineStatus() {
  const isOnline = useSyncExternalStore(
    (callback) => offlineStore.subscribe(callback),
    () => offlineStore.getOnlineStatus(),
    () => true
  );

  return { isOnline, isOffline: !isOnline };
}
