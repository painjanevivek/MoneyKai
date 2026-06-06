import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Badge } from '../types/badge';
import { BADGE_DEFINITIONS } from '../constants/badges';
import { isSupabaseConfigured } from '@/services/supabase';

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
    is_unlocked: index < 4, // First 4 badges unlocked for demo
    unlocked_at: index < 4 ? new Date(Date.now() - (index * 7 * 86400000)).toISOString() : undefined,
    progress: index < 4 ? 100 : Math.floor(Math.random() * 70),
  }));
};

export const useBadgeStore = create<BadgeState>()(
  persist(
    (set, get) => ({
      badges: isSupabaseConfigured() ? [] : createInitialBadges('demo'),
      recentUnlock: null,

      initializeBadges: (userId) => {
        if (get().badges.length === 0) {
          set({ badges: createInitialBadges(userId) });
        }
      },

      unlockBadge: (badgeType) => set((state) => ({
        badges: state.badges.map(b =>
          b.badge_type === badgeType
            ? { ...b, is_unlocked: true, unlocked_at: new Date().toISOString(), progress: 100 }
            : b
        ),
        recentUnlock: badgeType,
      })),

      updateProgress: (badgeType, progress) => set((state) => ({
        badges: state.badges.map(b =>
          b.badge_type === badgeType && !b.is_unlocked
            ? { ...b, progress: Math.min(100, progress) }
            : b
        ),
      })),

      clearRecentUnlock: () => set({ recentUnlock: null }),
    }),
    {
      name: 'smartpaisa-badges',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (isSupabaseConfigured()) {
          state.badges = state.badges.filter((badge) => badge.user_id !== 'demo');
        }
      },
    }
  )
);
