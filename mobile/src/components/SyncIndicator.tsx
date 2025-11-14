/**
 * Sync Indicator Component
 * 
 * Shows sync status when there are queued requests waiting to be synced.
 * Displays progress when actively syncing offline requests.
 */

import { View, Text, ActivityIndicator } from 'react-native';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Upload } from 'lucide-react-native';

export const SyncIndicator = () => {
  const { queueSize, isSyncing } = useOfflineSync();

  if (queueSize === 0 && !isSyncing) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: '#2563eb',
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      {isSyncing ? (
        <>
          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>
            Syncing {queueSize} {queueSize === 1 ? 'action' : 'actions'}...
          </Text>
        </>
      ) : (
        <>
          <Upload size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>
            {queueSize} {queueSize === 1 ? 'action' : 'actions'} waiting to sync
          </Text>
        </>
      )}
    </View>
  );
};
