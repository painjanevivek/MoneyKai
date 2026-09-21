import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
  Platform: { select: <T,>(values: { android?: T; default?: T }) => values.android ?? values.default },
}));
import { Colors } from '../../constants/theme';
import { getFeedbackPalette, PRIMARY_TABS, SCREEN_STATE_DEFAULTS } from './uiContracts';

describe('MoneyKai UI contracts', () => {
  it('exposes exactly the five approved primary destinations in order', () => {
    expect(PRIMARY_TABS.map((tab) => tab.route)).toEqual(['Home', 'Transactions', 'Add', 'Budget', 'More']);
    expect(new Set(PRIMARY_TABS.map((tab) => tab.icon)).size).toBe(PRIMARY_TABS.length);
  });

  it('covers every required progressive state with an icon and tone', () => {
    expect(Object.keys(SCREEN_STATE_DEFAULTS)).toEqual([
      'loading',
      'empty',
      'offline',
      'error',
      'conflict',
      'success',
      'neutral',
    ]);
    Object.values(SCREEN_STATE_DEFAULTS).forEach((state) => {
      expect(state.icon.length).toBeGreaterThan(0);
      expect(state.tone.length).toBeGreaterThan(0);
    });
  });

  it('maps every feedback tone to explicit foreground, background, and border values', () => {
    (['neutral', 'info', 'success', 'warning', 'danger', 'offline'] as const).forEach((tone) => {
      const palette = getFeedbackPalette(Colors.light, tone);
      expect(palette.foreground).toMatch(/^(#|rgba)/);
      expect(palette.background).toMatch(/^(#|rgba)/);
      expect(palette.border).toMatch(/^(#|rgba)/);
    });
  });
});
