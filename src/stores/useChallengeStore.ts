import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Challenge } from '../types/challenge';
import { MOTIVATIONAL_MESSAGES } from '../types/challenge';

interface ChallengeState {
  challenges: Challenge[];
  totalXP: number;

  // Getters
  getActiveChallenges: () => Challenge[];
  getCompletedChallenges: () => Challenge[];
  getDailyMotivation: () => string;

  // Actions
  startChallenge: (challenge: Omit<Challenge, 'id' | 'user_id' | 'created_at' | 'current_streak' | 'xp_earned' | 'savings_earned' | 'status'>) => void;
  updateStreak: (id: string) => void;
  failChallenge: (id: string) => void;
  completeChallenge: (id: string, xp: number, savings: number) => void;
}

const SAMPLE_CHALLENGES: Challenge[] = [
  {
    id: 'ch1',
    user_id: 'demo',
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
        challenges: SAMPLE_CHALLENGES,
        totalXP: 250,

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

      getDailyMotivation: () => {
        const index = new Date().getDate() % MOTIVATIONAL_MESSAGES.length;
        return MOTIVATIONAL_MESSAGES[index];
      },

      startChallenge: (challenge) => {
        const newChallenge: Challenge = {
          ...challenge,
          id: `ch_${Date.now()}`,
          user_id: 'demo',
          current_streak: 0,
          xp_earned: 0,
          savings_earned: 0,
          status: 'active',
          created_at: new Date().toISOString(),
        };
        set((state) => ({ challenges: [newChallenge, ...state.challenges] }));
      },

      updateStreak: (id) => set((state) => ({
        challenges: state.challenges.map(c =>
          c.id === id ? { ...c, current_streak: c.current_streak + 1 } : c
        ),
      })),

      failChallenge: (id) => set((state) => ({
        challenges: state.challenges.map(c =>
          c.id === id ? { ...c, status: 'failed' as const } : c
        ),
      })),

      completeChallenge: (id, xp, savings) => set((state) => ({
        challenges: state.challenges.map(c =>
          c.id === id ? { ...c, status: 'completed' as const, xp_earned: xp, savings_earned: savings } : c
        ),
        totalXP: state.totalXP + xp,
      })),
    };
  },
  {
      name: 'smartpaisa-challenges',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
