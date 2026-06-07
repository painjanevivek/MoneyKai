import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'failed';

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
  pendingCount: number;
  startSync: () => void;
  finishSync: (timestamp?: string) => void;
  failSync: (message: string) => void;
  clearSyncError: () => void;
  setPendingCount: (count: number) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      status: 'idle',
      lastSyncedAt: null,
      error: null,
      pendingCount: 0,
      startSync: () => set({ status: 'syncing', error: null }),
      finishSync: (timestamp = new Date().toISOString()) =>
        set({
          status: 'synced',
          lastSyncedAt: timestamp,
          error: null,
        }),
      failSync: (message) =>
        set({
          status: 'failed',
          error: message,
        }),
      clearSyncError: () => set({ error: null, status: 'idle' }),
      setPendingCount: (count) => set({ pendingCount: count }),
    }),
    {
      name: 'moneykai-sync',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastSyncedAt: state.lastSyncedAt,
        pendingCount: state.pendingCount,
      }),
    }
  )
);
