import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, parseISO } from 'date-fns';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CalendarState } from '@/types/calendar';

const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

export const getCurrentMonthKey = () => format(new Date(), 'yyyy-MM');

export const isValidMonthKey = (monthKey: string) => {
  if (!MONTH_KEY_PATTERN.test(monthKey)) return false;
  const parsed = parseISO(`${monthKey}-01`);
  return Number.isFinite(parsed.getTime()) && format(parsed, 'yyyy-MM') === monthKey;
};

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      selectedMonthKey: getCurrentMonthKey(),
      setSelectedMonthKey: (monthKey) => {
        if (!isValidMonthKey(monthKey)) return;
        set({ selectedMonthKey: monthKey });
      },
      resetToCurrentMonth: () => set({ selectedMonthKey: getCurrentMonthKey() }),
    }),
    {
      name: 'moneykai-calendar',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ selectedMonthKey: state.selectedMonthKey }),
    }
  )
);
