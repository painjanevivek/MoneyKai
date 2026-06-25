export type OptimisticMutationStatus = 'confirmed' | 'rolled_back' | 'superseded';

export interface OptimisticMutationErrorContext<TSnapshot> {
  error: unknown;
  mutationId: string;
  snapshot: TSnapshot;
  retry: () => Promise<OptimisticMutationResult>;
}

export interface OptimisticMutationOptions<TSnapshot, TResult = unknown> {
  mutationId: string;
  snapshot: () => TSnapshot;
  apply: () => void;
  commit: () => Promise<TResult>;
  rollback: (snapshot: TSnapshot) => void;
  reconcile?: (result: TResult) => void;
  onError?: (context: OptimisticMutationErrorContext<TSnapshot>) => void;
  shouldRollback?: (error: unknown) => boolean;
}

export interface OptimisticMutationResult<TResult = unknown> {
  status: OptimisticMutationStatus;
  result?: TResult;
  error?: unknown;
}

const mutationVersions = new Map<string, number>();

const nextMutationVersion = (mutationId: string) => {
  const next = (mutationVersions.get(mutationId) ?? 0) + 1;
  mutationVersions.set(mutationId, next);
  return next;
};

const isCurrentMutation = (mutationId: string, version: number) =>
  mutationVersions.get(mutationId) === version;

const clearMutationVersion = (mutationId: string, version: number) => {
  if (isCurrentMutation(mutationId, version)) {
    mutationVersions.delete(mutationId);
  }
};

export const isLikelyTransientMutationError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code?: unknown }).code ?? '');
    if (/unavailable|deadline-exceeded|aborted|cancelled|resource-exhausted/i.test(code)) {
      return true;
    }
    if (/permission-denied|unauthenticated|invalid-argument|failed-precondition/i.test(code)) {
      return false;
    }
  }

  const message = error instanceof Error ? error.message : String(error ?? '');
  return /network|offline|timeout|timed out|failed to fetch|unavailable|try again/i.test(message);
};

export const getOptimisticErrorMessage = (
  error: unknown,
  fallback = 'MoneyKai could not confirm that change. Your last local update was rolled back.',
) => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim();
    if (message.length > 0) {
      return message;
    }
  }
  return fallback;
};

export async function runOptimisticMutation<TSnapshot, TResult = unknown>(
  options: OptimisticMutationOptions<TSnapshot, TResult>,
): Promise<OptimisticMutationResult<TResult>> {
  const version = nextMutationVersion(options.mutationId);
  const snapshot = options.snapshot();
  options.apply();

  const retry = () => runOptimisticMutation(options);

  try {
    const result = await options.commit();
    if (!isCurrentMutation(options.mutationId, version)) {
      return { status: 'superseded', result };
    }
    options.reconcile?.(result);
    return { status: 'confirmed', result };
  } catch (error) {
    if (!isCurrentMutation(options.mutationId, version)) {
      return { status: 'superseded', error };
    }

    const shouldRollback = options.shouldRollback?.(error) ?? true;
    if (shouldRollback) {
      options.rollback(snapshot);
      options.onError?.({ error, mutationId: options.mutationId, snapshot, retry });
      return { status: 'rolled_back', error };
    }

    options.onError?.({ error, mutationId: options.mutationId, snapshot, retry });
    return { status: 'confirmed', error };
  } finally {
    clearMutationVersion(options.mutationId, version);
  }
}

export const __resetOptimisticMutationStateForTests = () => {
  mutationVersions.clear();
};
