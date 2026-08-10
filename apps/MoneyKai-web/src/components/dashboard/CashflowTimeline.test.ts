import { describe, expect, it, vi } from 'vitest';
import { buildPath, getChartDomain, getX, getY } from './CashflowTimeline';

vi.mock('react-native', () => ({
  Dimensions: { get: () => ({ width: 1024, height: 768 }) },
  Platform: { OS: 'web' },
  Text: () => null,
  View: () => null,
}));

vi.mock('react-native-svg', () => {
  const SvgNode = () => null;
  return {
    default: SvgNode,
    Circle: SvgNode,
    G: SvgNode,
    Line: SvgNode,
    Path: SvgNode,
    Rect: SvgNode,
    Text: SvgNode,
  };
});

vi.mock('@/hooks/useTheme', () => ({ useTheme: () => ({ colors: {} }) }));
vi.mock('@/utils/formatCurrency', () => ({
  formatCompactCurrency: (value: number) => String(value),
  formatCurrency: (value: number) => String(value),
}));
vi.mock('../ui/Button', () => ({ Button: () => null }));
vi.mock('../ui/Card', () => ({ Card: () => null }));
vi.mock('../ui/EmptyState', () => ({ EmptyState: () => null }));

describe('cashflow chart helpers', () => {
  it('places one point and multi-point endpoints deterministically', () => {
    expect(getX(0, 1, 240)).toBe(0);
    expect(getX(0, 3, 240)).toBe(0);
    expect(getX(2, 3, 240)).toBe(240);
  });

  it('keeps a flat range finite', () => {
    const y = getY(0, 0, 0, 180);

    expect(y).toBe(180);
    expect(Number.isFinite(y)).toBe(true);
  });

  it('starts a new SVG segment after missing values', () => {
    expect(buildPath([0, null, 10], 100, 100, 0, 10)).toBe('M 0 100 M 100 0');
  });

  it('pads a crossing range and ignores non-finite values', () => {
    expect(getChartDomain([-50, 100, null, Number.NaN])).toEqual({ min: -65, max: 115 });
  });

  it('returns a safe domain for empty and flat-zero data', () => {
    expect(getChartDomain([])).toEqual({ min: -1, max: 1 });
    expect(getChartDomain([0, 0])).toEqual({ min: -1, max: 1 });
  });
});
