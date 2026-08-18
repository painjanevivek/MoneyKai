import React, { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SurfaceState } from './SurfaceState';

vi.mock('react-native', () => ({
  Dimensions: { get: () => ({ height: 768, width: 1024 }) },
  Text: () => null,
  View: () => null,
}));

vi.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: Object.assign(() => null, { glyphMap: {} }),
}));

vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      borderLight: '#d9d9d9',
      error: '#b42318',
      info: '#2563eb',
      primary: '#d86736',
      surface: '#fffdfa',
      surfaceElevated: '#fbf6f0',
      textPrimary: '#28211c',
      textSecondary: '#70665d',
      textTertiary: '#786d63',
      warning: '#b45309',
    },
  }),
}));

const collectText = (node: ReactNode): string[] => {
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap(collectText);
  if (!React.isValidElement(node)) return [];
  return collectText((node.props as { children?: ReactNode }).children);
};

const findLiveRegion = (node: ReactNode): string | undefined => {
  if (Array.isArray(node)) return node.map(findLiveRegion).find(Boolean);
  if (!React.isValidElement(node)) return undefined;
  const props = node.props as { accessibilityLiveRegion?: string; children?: ReactNode };
  return props.accessibilityLiveRegion ?? findLiveRegion(props.children);
};

describe('SurfaceState', () => {
  it('communicates a loading state without pretending a result is ready', () => {
    const rendered = SurfaceState({
      kind: 'loading',
      headline: 'Preparing your report',
      detail: 'This can take a moment.',
    });

    expect(collectText(rendered)).toEqual(expect.arrayContaining([
      'Preparing your report',
      'This can take a moment.',
    ]));
    expect(findLiveRegion(rendered)).toBe('polite');
  });

  it('explains an empty state and preserves an available next action', () => {
    const rendered = SurfaceState({
      kind: 'empty',
      headline: 'No saved reports yet',
      detail: 'Create a report when you are ready.',
      primaryAction: <span>Create report</span>,
    });

    expect(collectText(rendered)).toEqual(expect.arrayContaining([
      'No saved reports yet',
      'Create a report when you are ready.',
      'Create report',
    ]));
    expect(findLiveRegion(rendered)).toBe('none');
  });

  it('keeps unavailable and error conditions distinguishable and recoverable', () => {
    const unavailable = SurfaceState({
      kind: 'unavailable',
      headline: 'Exports are unavailable right now',
      secondaryAction: <span>Try again</span>,
    });
    const error = SurfaceState({
      kind: 'error',
      headline: 'We could not prepare this report',
      secondaryAction: <span>Retry</span>,
    });

    expect(collectText(unavailable)).toEqual(expect.arrayContaining([
      'Exports are unavailable right now',
      'Try again',
    ]));
    expect(collectText(error)).toEqual(expect.arrayContaining([
      'We could not prepare this report',
      'Retry',
    ]));
  });
});
