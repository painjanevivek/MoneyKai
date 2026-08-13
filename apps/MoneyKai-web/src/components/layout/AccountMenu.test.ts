import React, { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AccountMenu } from './AccountMenu';

vi.mock('react-native', () => ({
  Dimensions: { get: () => ({ width: 1024, height: 768 }) },
  Platform: { OS: 'web' },
  Pressable: () => null,
  Text: () => null,
  View: () => null,
}));
vi.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      borderLight: '#000000',
      error: '#000000',
      primary: '#000000',
      surface: '#000000',
      surfaceElevated: '#000000',
      textPrimary: '#000000',
      textSecondary: '#000000',
      textTertiary: '#000000',
    },
  }),
}));
vi.mock('@/components/ui/UserAvatar', () => ({ UserAvatar: () => null }));

vi.spyOn(React, 'useState').mockReturnValue([true, vi.fn()]);

const collectText = (node: ReactNode): string[] => {
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap(collectText);
  if (!React.isValidElement(node)) return [];
  return collectText((node.props as { children?: ReactNode }).children);
};

describe('AccountMenu', () => {
  it('shows profile, settings, and sign-out actions in its account popover', () => {
    const text = collectText(AccountMenu({
      user: { full_name: 'U See', email: 'kevil@example.com' },
      placement: 'above',
      onProfile: vi.fn(),
      onSettings: vi.fn(),
      onSignOut: vi.fn(),
    }));

    expect(text).toEqual(expect.arrayContaining([
      'U See',
      'kevil@example.com',
      'Profile',
      'Settings',
      'Sign out',
    ]));
  });
});
