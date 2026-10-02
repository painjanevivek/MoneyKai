import { beforeEach, describe, expect, it, vi } from 'vitest';

const saved = vi.hoisted(() => new Map<string, string>());

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => saved.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => { saved.set(key, value); }),
    removeItem: vi.fn(async (key: string) => { saved.delete(key); }),
  },
}));

import { useHomeModeStore } from './useHomeModeStore';

describe('Home dashboard mode', () => {
  beforeEach(() => {
    saved.clear();
    useHomeModeStore.setState({ mode: 'advanced' });
  });

  it('starts in the existing advanced view', () => {
    expect(useHomeModeStore.getState().mode).toBe('advanced');
  });

  it('switches to Basic and remembers the choice', async () => {
    useHomeModeStore.getState().setMode('basic');

    expect(useHomeModeStore.getState().mode).toBe('basic');
    await vi.waitFor(() => expect(saved.get('moneykai-home-mode')).toContain('"mode":"basic"'));
  });
});
