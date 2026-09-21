import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
  Platform: { select: <T,>(values: { android?: T; default?: T }) => values.android ?? values.default },
}));

import { ComponentTokens, Motion, SemanticColors } from '../constants/theme';

const mobileRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const activeSources = [
  'navigation/GlassTabBar.tsx',
  'screens/auth/ProgressiveLoginScreen.tsx',
  'screens/app/HomeOverviewScreen.tsx',
  'screens/app/TransactionsScreen.tsx',
  'screens/app/BudgetScreen.tsx',
  'screens/app/GroupsHubScreen.tsx',
  'screens/app/AccountScreen.tsx',
  'screens/app/TrustCenterScreen.tsx',
  'screens/app/SettingsOverviewScreen.tsx',
].map((path) => readFileSync(resolve(mobileRoot, path), 'utf8'));

const channel = (hex: string, offset: number) => parseInt(hex.slice(offset, offset + 2), 16) / 255;
const luminance = (hex: string) => {
  const linearize = (value: number) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  return 0.2126 * linearize(channel(hex, 1)) + 0.7152 * linearize(channel(hex, 3)) + 0.0722 * linearize(channel(hex, 5));
};
const contrast = (foreground: string, background: string) => {
  const values = [luminance(foreground), luminance(background)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
};

describe('active mobile accessibility foundations', () => {
  it('supports Android minimum target geometry and a zero-motion path', () => {
    expect(ComponentTokens.minTouchTarget).toBeGreaterThanOrEqual(44);
    expect(ComponentTokens.controlHeight.sm).toBeGreaterThanOrEqual(44);
    expect(Motion.reducedDuration).toBe(0);
  });

  it('keeps restrained-glass navigation text at AA contrast', () => {
    expect(contrast(SemanticColors.textPrimary, SemanticColors.surfaceSupport)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(SemanticColors.textSecondary, SemanticColors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(SemanticColors.onAction, SemanticColors.action)).toBeGreaterThanOrEqual(4.5);
  });

  it('does not disable font scaling on active production surfaces', () => {
    for (const source of activeSources) {
      expect(source).not.toMatch(/allowFontScaling\s*=\s*\{?false\}?/);
    }
  });

  it('allows the compact tab labels to scale to 200 percent', () => {
    const tabBar = activeSources[0];
    expect(tabBar).toContain('maxFontSizeMultiplier={2}');
    expect(tabBar).toContain('numberOfLines={2}');
  });

  it('wires labels and states for primary interactive surfaces', () => {
    const combined = activeSources.join('\n');
    expect(combined).toContain('accessibilityRole="tab"');
    expect(combined).toContain('accessibilityState={{ selected }}');
    expect(combined).toContain('accessibilityRole="button"');
    expect(combined).toContain('<FeedbackBanner');
  });
});
