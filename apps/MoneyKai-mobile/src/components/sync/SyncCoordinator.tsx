import { useEffect } from 'react';
import * as Network from 'expo-network';
import { AppState } from 'react-native';
import { flushSyncQueue } from '@/services/syncQueue';

export function SyncCoordinator() {
  useEffect(() => {
    void flushSyncQueue();

    const networkSubscription = Network.addNetworkStateListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        void flushSyncQueue();
      }
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void flushSyncQueue();
      }
    });

    return () => {
      networkSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  return null;
}
