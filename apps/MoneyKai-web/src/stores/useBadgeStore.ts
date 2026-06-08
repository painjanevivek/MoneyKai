import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Badge } from '../types/badge';
import { BADGE_DEFINITIONS } from '../constants/badges';
import { useAuthStore } from './useAuthStore';
import { upsertUserDoc } from '@/services/firestoreData';
import { requestAutomaticBackup } from '@/services/backupService';

const syncBadgeUpdate = (badge: Badge) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  void upsertUserDoc('badges', userId, badge).catch((error) => {
    if (__DEV__) console.warn('[MoneyKai] failed to sync badge update:', error);
  });
};

interface BadgeState {
  badges: Badge[];
  recentUnlock: string | null;

  // Actions
  initializeBadges: (userId: string) => void;
  unlockBadge: (badgeType: string) => void;
  updateProgress: (badgeType: string, progress: number) => void;
  clearRecentUnlock: () => void;
}

const createInitialBadges = (userId: string): Badge[] => {
  return BADGE_DEFINITIONS.map((def, index) => ({
    id: `badge_${def.id}`,
    user_id: userId,
    badge_type: def.id,
    name: def.name,
    description: def.description,
    is_unlocked: index < 4, // First four badges unlocked for starter content
    unlocked_at: index < 4 ? new Date(Date.now() - (index * 7 * 86400000)).toISOString() : undefined,
    progress: index < 4 ? 100 : Math.floor(Math.random() * 70),
  }));
};

export const useBadgeStore = create<BadgeState>()(
  persist(
    (set, get) => ({
      badges: [],
      recentUnlock: null,

      initializeBadges: (userId) => {
        if (get().badges.length === 0) {
          set({ badges: createInitialBadges(userId) });
        }
      },

      unlockBadge: (badgeType) => {
        const updated: Badge[] = [];
        set((state) => {
          const badges = state.badges.map((b) => {
            if (b.badge_type !== badgeType) return b;
            const next = { ...b, is_unlocked: true, unlocked_at: new Date().toISOString(), progress: 100 };
            updated.push(next);
            return next;
          });
          return {
            badges,
            recentUnlock: badgeType,
          };
        });
        updated.forEach(syncBadgeUpdate);
        void requestAutomaticBackup('badge updated');
      },

      updateProgress: (badgeType, progress) => {
        const updated: Badge[] = [];
        set((state) => {
          const badges = state.badges.map((b) =>
            b.badge_type === badgeType && !b.is_unlocked
              ? (() => {
                  const next = { ...b, progress: Math.min(100, progress) };
                  updated.push(next);
                  return next;
                })()
              : b
          );
          return { badges };
        });
        updated.forEach(syncBadgeUpdate);
        void requestAutomaticBackup('badge progress updated');
      },

      clearRecentUnlock: () => set({ recentUnlock: null }),
    }),
    {
      name: 'moneykai-badges',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

