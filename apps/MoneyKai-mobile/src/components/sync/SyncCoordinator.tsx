import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { flushSyncQueue } from '@/services/syncQueue';
import { flushAutomaticBackup } from '@/services/backupService';
import { syncRemoteState } from '@/services/remoteSync';
import { useSyncStore } from '@/stores/useSyncStore';

export function SyncCoordinator() {
  useEffect(() => {
    let mounted = true;
    let wasOnline = true;
    let flushInFlight = false;

    const flushWhenOnline = async ({ refreshRemote = false }: { refreshRemote?: boolean } = {}) => {
      if (flushInFlight) {
        return;
      }
      flushInFlight = true;
      try {
        const state = await NetInfo.fetch().catch(() => undefined);
        if (!mounted) {
          return;
        }
        const isOnline = !state || (state.isConnected !== false && state.isInternetReachable !== false);
        useSyncStore.getState().setOnline(isOnline);
        if (isOnline) {
          await flushSyncQueue();
          await flushAutomaticBackup({ force: false });
          if (refreshRemote) {
            const pendingCount = useSyncStore.getState().pendingCount;
            if (pendingCount === 0) {
              await syncRemoteState({ force: true });
            }
          }
        }
      } finally {
        flushInFlight = false;
      }
    };

    void flushWhenOnline();
    const intervalId = setInterval(() => {
      void flushWhenOnline();
    }, 30000);

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void flushWhenOnline({ refreshRemote: true });
      }
    });

    const networkSubscription = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected !== false && state.isInternetReachable !== false;
      useSyncStore.getState().setOnline(isOnline);
      if (!wasOnline && isOnline) {
        void flushWhenOnline({ refreshRemote: true });
      }
      wasOnline = isOnline;
    });

    return () => {
      mounted = false;
      clearInterval(intervalId);
      appStateSubscription.remove();
      networkSubscription();
    };
  }, []);

  return null;
}
