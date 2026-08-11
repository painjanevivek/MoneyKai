import { describe, expect, it, vi } from 'vitest';
import { getReportingMonthFilter } from './ReportingMonthContext';

const transactionStore = vi.hoisted(() => ({
  setFilter: (_filter: unknown) => undefined,
}));

vi.mock('@/stores/useTransactionStore', () => ({
  useTransactionStore: <T,>(selector: (state: typeof transactionStore) => T) => selector(transactionStore),
}));

describe('ReportingMonthProvider', () => {
  it('builds the custom transaction filter for every day in the selected month', () => {
    expect(getReportingMonthFilter(new Date(2024, 1, 1))).toEqual({
      dateRange: 'custom',
      startDate: '2024-02-01',
      endDate: '2024-02-29',
    });
  });

});
