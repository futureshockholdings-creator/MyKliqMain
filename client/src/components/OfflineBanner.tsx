import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const { isOffline } = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#ef4444',
        color: '#ffffff',
        paddingTop: 'max(8px, env(safe-area-inset-top))',
        paddingBottom: '8px',
        paddingLeft: '16px',
        paddingRight: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <WifiOff size={16} />
      <span>You're offline — showing last saved data</span>
    </div>
  );
}
