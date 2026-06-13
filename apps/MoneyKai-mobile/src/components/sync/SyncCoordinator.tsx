import { useEffect } from 'react';
import * as Network from 'expo-network';
import { AppState } from 'react-native';
import { flushSyncQueue } from '@/services/syncQueue';

export function SyncCoordinator() {
  useEffect(() => {
    let mounted = true;

    const flushWhenOnline = async () => {
      const state = await Network.getNetworkStateAsync().catch(() => undefined);
      if (!mounted) {
        return;
      }
      if (!state || (state.isConnected && state.isInternetReachable !== false)) {
        void flushSyncQueue();
      }
    };

    void flushWhenOnline();
    const intervalId = setInterval(() => {
      void flushWhenOnline();
    }, 30000);

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void flushWhenOnline();
      }
    });

    return () => {
      mounted = false;
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  }, []);

  return null;
}
