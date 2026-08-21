import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DASHBOARD_LAYOUT,
  moveDashboardSection,
  normalizeDashboardLayout,
} from './dashboardLayout';

describe('dashboard layout customization', () => {
  it('restores missing sections and removes invalid or duplicate entries', () => {
    expect(normalizeDashboardLayout(['records', 'cashflow', 'records', 'unknown'])).toEqual([
      'records',
      'cashflow',
      'overview',
      'breakdown',
      'signals',
    ]);
  });

  it('returns the default layout for invalid persisted state', () => {
    expect(normalizeDashboardLayout(null)).toEqual(DEFAULT_DASHBOARD_LAYOUT);
  });

  it('moves a section one position without mutating the original order', () => {
    const original = [...DEFAULT_DASHBOARD_LAYOUT];
    const moved = moveDashboardSection(original, 'records', -1);
    expect(moved).toEqual(['overview', 'cashflow', 'breakdown', 'records', 'signals']);
    expect(original).toEqual(DEFAULT_DASHBOARD_LAYOUT);
  });

  it('keeps the order stable when movement would leave the list', () => {
    expect(moveDashboardSection(DEFAULT_DASHBOARD_LAYOUT, 'overview', -1)).toEqual(DEFAULT_DASHBOARD_LAYOUT);
    expect(moveDashboardSection(DEFAULT_DASHBOARD_LAYOUT, 'records', 1)).toEqual(DEFAULT_DASHBOARD_LAYOUT);
  });
});
