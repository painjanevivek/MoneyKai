import { describe, expect, it, vi } from 'vitest';
import * as picker from './ReportingMonthPicker';

vi.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
vi.mock('react-native', () => ({
  Pressable: () => null,
  Text: () => null,
  View: () => null,
}));
vi.mock('@/hooks/useTheme', () => ({ useTheme: () => ({ colors: {} }) }));
vi.mock('@/constants/theme', () => ({
  BorderRadius: {},
  Shadows: {},
  Spacing: {},
  Typography: { fontSize: {}, fontFamily: {} },
}));
vi.mock('@/components/ui/Button', () => ({ Button: () => null }));
vi.mock('@/utils/glassStyle', () => ({ glassBackdropStyle: undefined }));
vi.mock('./ReportingMonthContext', () => ({ useReportingMonth: () => ({}) }));

describe('ReportingMonthPicker month availability', () => {
  it.each([
    ['2026-07', '2026-08', false],
    ['2026-08', '2026-08', false],
    ['2026-09', '2026-08', true],
    ['2027-01', '2026-08', true],
  ])('marks %s as future relative to %s: %s', (monthKey, currentMonthKey, expected) => {
    expect(typeof picker.isFutureReportingMonth).toBe('function');
    expect(picker.isFutureReportingMonth?.(monthKey, currentMonthKey)).toBe(expected);
  });

  it.each([
    [2025, '2026-08', false],
    [2026, '2026-08', true],
    [2027, '2026-08', true],
  ])('disables next-year navigation from %i relative to %s: %s', (visibleYear, currentMonthKey, expected) => {
    expect(typeof picker.isNextReportingYearDisabled).toBe('function');
    expect(picker.isNextReportingYearDisabled?.(visibleYear, currentMonthKey)).toBe(expected);
  });
});
