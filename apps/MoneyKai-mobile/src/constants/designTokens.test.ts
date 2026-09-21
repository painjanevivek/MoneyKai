import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
  Platform: { select: <T,>(values: { android?: T; default?: T }) => values.android ?? values.default },
}));

import {
  BrandPalette,
  ComponentTokens,
  Colors,
  Motion,
  SemanticColors,
  Typography,
  getPaletteForThemeMode,
  getThemeModeForPalette,
  isThemeModeDark,
} from './theme';

const channel = (hex: string, offset: number) => parseInt(hex.slice(offset, offset + 2), 16) / 255;

const luminance = (hex: string) => {
  const linearize = (value: number) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const red = linearize(channel(hex, 1));
  const green = linearize(channel(hex, 3));
  const blue = linearize(channel(hex, 5));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrast = (foreground: string, background: string) => {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
};

describe('MoneyKai production design tokens', () => {
  it('keeps one immutable production color object', () => {
    expect(Colors.light).toEqual(SemanticColors);
    expect(Object.keys(Colors.light).some((key) => key.toLowerCase().includes('gradient'))).toBe(false);
  });

  it('meets AA contrast for the primary text and action pairs', () => {
    expect(contrast(SemanticColors.textPrimary, SemanticColors.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(SemanticColors.textSecondary, SemanticColors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(SemanticColors.primary, SemanticColors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(SemanticColors.onAction, SemanticColors.action)).toBeGreaterThanOrEqual(4.5);
  });

  it('normalizes every stored legacy appearance to the light production theme', () => {
    expect(getThemeModeForPalette('deepJade', true)).toBe('light');
    expect(getPaletteForThemeMode('monsoonGlassDark')).toBe('ivoryEmerald');
    expect(isThemeModeDark('dark')).toBe(false);
  });

  it('provides readable type, touch, and bounded motion foundations', () => {
    expect(Typography.fontSize.xs).toBeGreaterThanOrEqual(12);
    expect(ComponentTokens.minTouchTarget).toBeGreaterThanOrEqual(44);
    expect(Motion.duration.standard).toBeLessThanOrEqual(240);
    expect(Motion.reducedDuration).toBe(0);
    expect(BrandPalette.paper).toBe('#F8F7F0');
  });
});
