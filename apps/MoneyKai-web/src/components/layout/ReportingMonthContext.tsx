import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { useTransactionStore } from '@/stores/useTransactionStore';

export interface ReportingMonthValue {
  selectedMonthKey: string;
  selectedMonthDate: Date;
  currentMonthKey: string;
  monthRangeLabel: string;
  selectMonth: (monthKey: string) => void;
  resetToCurrentMonth: () => void;
}

const ReportingMonthContext = createContext<ReportingMonthValue | null>(null);

const getCurrentMonthKey = () => format(new Date(), 'yyyy-MM');

const parseMonthKey = (monthKey: string) => {
  const [yearValue, monthValue] = monthKey.split('-').map((part) => Number(part));
  const now = new Date();
  const safeYear = Number.isFinite(yearValue) && yearValue > 1900 ? yearValue : now.getFullYear();
  const safeMonthIndex = Number.isFinite(monthValue) ? Math.min(Math.max(monthValue - 1, 0), 11) : now.getMonth();
  return new Date(safeYear, safeMonthIndex, 1);
};

export const getReportingMonthFilter = (selectedMonthDate: Date) => ({
  dateRange: 'custom' as const,
  startDate: format(startOfMonth(selectedMonthDate), 'yyyy-MM-dd'),
  endDate: format(endOfMonth(selectedMonthDate), 'yyyy-MM-dd'),
});

export function ReportingMonthProvider({ children }: PropsWithChildren) {
  const setTransactionFilter = useTransactionStore((state) => state.setFilter);
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState(currentMonthKey);
  const selectedMonthDate = useMemo(() => parseMonthKey(selectedMonthKey), [selectedMonthKey]);

  useEffect(() => {
    setTransactionFilter(getReportingMonthFilter(selectedMonthDate));
  }, [selectedMonthDate, setTransactionFilter]);

  const selectMonth = useCallback((monthKey: string) => {
    setSelectedMonthKey(monthKey);
  }, []);

  const resetToCurrentMonth = useCallback(() => {
    setSelectedMonthKey(currentMonthKey);
  }, [currentMonthKey]);

  const value = useMemo<ReportingMonthValue>(() => ({
    selectedMonthKey,
    selectedMonthDate,
    currentMonthKey,
    monthRangeLabel: `${format(startOfMonth(selectedMonthDate), 'MMM d')} - ${format(endOfMonth(selectedMonthDate), 'MMM d, yyyy')}`,
    selectMonth,
    resetToCurrentMonth,
  }), [currentMonthKey, resetToCurrentMonth, selectMonth, selectedMonthDate, selectedMonthKey]);

  return (
    <ReportingMonthContext.Provider value={value}>
      {children}
    </ReportingMonthContext.Provider>
  );
}

export function useReportingMonth(): ReportingMonthValue {
  const context = useContext(ReportingMonthContext);

  if (!context) {
    throw new Error('useReportingMonth must be used inside ReportingMonthProvider');
  }

  return context;
}
