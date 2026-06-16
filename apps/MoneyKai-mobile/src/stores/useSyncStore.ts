import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'failed';

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  lastCacheHydratedAt: string | null;
  error: string | null;
  pendingCount: number;
  isOnline: boolean;
  startSync: () => void;
  finishSync: (timestamp?: string) => void;
  failSync: (message: string) => void;
  clearSyncError: () => void;
  setPendingCount: (count: number) => void;
  setOnline: (isOnline: boolean) => void;
  markCacheHydrated: (timestamp: string) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      status: 'idle',
      lastSyncedAt: null,
      lastCacheHydratedAt: null,
      error: null,
      pendingCount: 0,
      isOnline: true,
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
      setOnline: (isOnline) => set({ isOnline }),
      markCacheHydrated: (timestamp) => set({ lastCacheHydratedAt: timestamp }),
    }),
    {
      name: 'moneykai-sync',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastSyncedAt: state.lastSyncedAt,
        lastCacheHydratedAt: state.lastCacheHydratedAt,
        pendingCount: state.pendingCount,
      }),
    }
  )
);
