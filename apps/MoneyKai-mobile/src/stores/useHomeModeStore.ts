import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type HomeMode = 'advanced' | 'basic';

type HomeModeState = {
  mode: HomeMode;
  setMode: (mode: HomeMode) => void;
};

export const useHomeModeStore = create<HomeModeState>()(
  persist(
    (set) => ({
      mode: 'advanced',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'moneykai-home-mode',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);
