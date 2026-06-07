import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Challenge } from '../types/challenge';
import { MOTIVATIONAL_MESSAGES } from '../types/challenge';
import { recordAppNotification } from '@/services/notificationService';
import { useAuthStore } from './useAuthStore';
import { isFirebaseConfigured } from '@/services/firebase';
import { backendApi, isBackendConfigured } from '@/services/backendApi';

const syncChallengeCreate = (challenge: Challenge) => {
  if (!isBackendConfigured()) return;
  void backendApi.createChallenge(challenge).catch((error) => {
    if (__DEV__) console.warn('[MoneyKai] failed to sync challenge create:', error);
  });
};

const syncChallengeUpdate = (challengeId: string, payload: Partial<Challenge>) => {
  if (!isBackendConfigured()) return;
  void backendApi.updateChallenge(challengeId, payload).catch((error) => {
    if (__DEV__) console.warn('[MoneyKai] failed to sync challenge update:', error);
  });
};

interface ChallengeState {
  challenges: Challenge[];
  totalXP: number;

  // Getters
  getActiveChallenges: () => Challenge[];
  getCompletedChallenges: () => Challenge[];
  getDeactivatedChallenges: () => Challenge[];
  getDailyMotivation: () => string;

  // Actions
  startChallenge: (challenge: Omit<Challenge, 'id' | 'user_id' | 'created_at' | 'current_streak' | 'xp_earned' | 'savings_earned' | 'status'>) => void;
  updateStreak: (id: string) => void;
  failChallenge: (id: string) => void;
  deactivateChallenge: (id: string) => void;
  reactivateChallenge: (id: string) => void;
  completeChallenge: (id: string, xp: number, savings: number) => void;
}

const SAMPLE_CHALLENGES: Challenge[] = [
  {
    id: 'ch1',
    user_id: 'sample',
    name: 'No Food Delivery',
    category: 'food',
    description: 'Avoid food delivery for 7 days',
    duration_days: 7,
    current_streak: 3,
    xp_earned: 0,
    savings_earned: 0,
    status: 'active',
    start_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => {
      let cachedActive: Challenge[] = [];
      let lastTxnsForActive: Challenge[] = [];
      
      let cachedCompleted: Challenge[] = [];
      let lastTxnsForCompleted: Challenge[] = [];

      return {
      challenges: isFirebaseConfigured() ? [] : SAMPLE_CHALLENGES,
      totalXP: isFirebaseConfigured() ? 0 : 250,

        getActiveChallenges: () => {
          const challenges = get().challenges;
          if (challenges === lastTxnsForActive) return cachedActive;
          const result = challenges.filter(c => c.status === 'active');
          lastTxnsForActive = challenges;
          cachedActive = result;
          return result;
        },

      getCompletedChallenges: () => {
        const challenges = get().challenges;
        if (challenges === lastTxnsForCompleted) return cachedCompleted;
        const result = challenges.filter(c => c.status === 'completed');
        lastTxnsForCompleted = challenges;
        cachedCompleted = result;
        return result;
      },

      getDeactivatedChallenges: () => get().challenges.filter((challenge) => challenge.status === 'deactivated'),

      getDailyMotivation: () => {
        const index = new Date().getDate() % MOTIVATIONAL_MESSAGES.length;
        return MOTIVATIONAL_MESSAGES[index];
      },

      startChallenge: (challenge) => {
        const userId = useAuthStore.getState().user?.id ?? 'local';
        const alreadyActive = get().challenges.some(
          (item) => item.status === 'active' && item.name === challenge.name && item.category === challenge.category
        );

        if (alreadyActive) {
          return;
        }

        const newChallenge: Challenge = {
          ...challenge,
          id: `ch_${Date.now()}`,
          user_id: userId,
          current_streak: 0,
          xp_earned: 0,
          savings_earned: 0,
          status: 'active',
          created_at: new Date().toISOString(),
        };
        set((state) => ({ challenges: [newChallenge, ...state.challenges] }));
        syncChallengeCreate(newChallenge);
        void recordAppNotification({
          title: 'Challenge started',
          body: newChallenge.name,
          type: 'challenge',
          actionRoute: '/(tabs)/savings',
        });
      },

      updateStreak: (id) => {
        const challenge = get().challenges.find((item) => item.id === id);
        if (!challenge) return;
        const next = { current_streak: challenge.current_streak + 1 };
        set((state) => ({
          challenges: state.challenges.map(c =>
            c.id === id ? { ...c, ...next } : c
          ),
        }));
        syncChallengeUpdate(id, next);
      },

      failChallenge: (id) => {
        set((state) => ({
          challenges: state.challenges.map(c =>
            c.id === id ? { ...c, status: 'failed' as const } : c
          ),
        }));
        syncChallengeUpdate(id, { status: 'failed' });
      },

      deactivateChallenge: (id) => {
        set((state) => ({
          challenges: state.challenges.map(c =>
            c.id === id ? { ...c, status: 'deactivated' as const } : c
          ),
        }));
        void backendApi.deactivateChallenge(id).catch((error) => {
          if (__DEV__) console.warn('[MoneyKai] failed to sync challenge deactivate:', error);
        });
      },

      reactivateChallenge: (id) => {
        set((state) => ({
          challenges: state.challenges.map(c =>
            c.id === id ? { ...c, status: 'active' as const } : c
          ),
        }));
        void backendApi.reactivateChallenge(id).catch((error) => {
          if (__DEV__) console.warn('[MoneyKai] failed to sync challenge reactivate:', error);
        });
      },

      completeChallenge: (id, xp, savings) => {
        set((state) => ({
          challenges: state.challenges.map(c =>
            c.id === id ? { ...c, status: 'completed' as const, xp_earned: xp, savings_earned: savings } : c
          ),
          totalXP: state.totalXP + xp,
        }));
        void backendApi.completeChallenge(id, { xp_earned: xp, savings_earned: savings }).catch((error) => {
          if (__DEV__) console.warn('[MoneyKai] failed to sync challenge completion:', error);
        });
      },
    };
  },
    {
      name: 'moneykai-challenges',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (isFirebaseConfigured()) {
          state.challenges = state.challenges.filter((challenge) => challenge.user_id !== 'sample');
          state.totalXP = state.challenges.reduce((sum, challenge) => sum + challenge.xp_earned, 0);
        }
      },
    }
  )
);

