import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetOptimisticMutationStateForTests,
  isLikelyTransientMutationError,
  runOptimisticMutation,
} from './optimisticMutation';

describe('optimisticMutation', () => {
  beforeEach(() => {
    __resetOptimisticMutationStateForTests();
  });

  it('applies immediately and reconciles on success', async () => {
    let value = 'old';
    const result = await runOptimisticMutation({
      mutationId: 'note:1',
      snapshot: () => value,
      apply: () => {
        value = 'optimistic';
      },
      commit: async () => 'server',
      reconcile: (serverValue) => {
        value = serverValue;
      },
      rollback: (previous) => {
        value = previous;
      },
    });

    expect(result.status).toBe('confirmed');
    expect(value).toBe('server');
  });

  it('rolls back and exposes retry on failure', async () => {
    let value = 'old';
    let attempts = 0;
    const onError = vi.fn();

    const result = await runOptimisticMutation({
      mutationId: 'note:1',
      snapshot: () => value,
      apply: () => {
        value = 'optimistic';
      },
      commit: async () => {
        attempts += 1;
        throw new Error('permission denied');
      },
      rollback: (previous) => {
        value = previous;
      },
      onError,
    });

    expect(result.status).toBe('rolled_back');
    expect(value).toBe('old');
    expect(onError).toHaveBeenCalledTimes(1);
    await expect(onError.mock.calls[0][0].retry()).resolves.toMatchObject({ status: 'rolled_back' });
    expect(attempts).toBe(2);
  });

  it('does not let stale failures roll back newer optimistic state', async () => {
    let value = 'old';
    let failFirst!: (error: Error) => void;

    const first = runOptimisticMutation({
      mutationId: 'note:1',
      snapshot: () => value,
      apply: () => {
        value = 'first';
      },
      commit: () =>
        new Promise<string>((_resolve, reject) => {
          failFirst = reject;
        }),
      rollback: (previous) => {
        value = previous;
      },
    });

    const second = await runOptimisticMutation({
      mutationId: 'note:1',
      snapshot: () => value,
      apply: () => {
        value = 'second';
      },
      commit: async () => 'second-confirmed',
      rollback: (previous) => {
        value = previous;
      },
      reconcile: (serverValue) => {
        value = serverValue;
      },
    });

    failFirst(new Error('network timeout'));
    const stale = await first;

    expect(second.status).toBe('confirmed');
    expect(stale.status).toBe('superseded');
    expect(value).toBe('second-confirmed');
  });

  it('classifies transient errors for offline-aware callers', () => {
    expect(isLikelyTransientMutationError(new Error('Network timeout'))).toBe(true);
    expect(isLikelyTransientMutationError({ code: 'unavailable' })).toBe(true);
    expect(isLikelyTransientMutationError({ code: 'permission-denied' })).toBe(false);
  });
});
