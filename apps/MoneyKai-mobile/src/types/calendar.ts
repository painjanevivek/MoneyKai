export interface CalendarState {
  selectedMonthKey: string;
  setSelectedMonthKey: (monthKey: string) => void;
  resetToCurrentMonth: () => void;
}
