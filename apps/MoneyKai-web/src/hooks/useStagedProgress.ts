import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type ProgressFlowStatus = 'failed' | 'idle' | 'running' | 'success';

export type ProgressFlowStep = {
  id: string;
  label: string;
  detail?: string;
  targetProgress: number;
};

type StagedProgressOptions = {
  holdAt?: number;
  intervalMs?: number;
  steps: ProgressFlowStep[];
};

const clamp = (value: number, max = 100) => Math.max(0, Math.min(max, value));

export function useStagedProgress({
  holdAt = 88,
  intervalMs = 420,
  steps,
}: StagedProgressOptions) {
  const safeSteps = useMemo(
    () =>
      steps.length > 0
        ? steps
        : [{ id: 'working', label: 'Working', targetProgress: holdAt }],
    [holdAt, steps],
  );
  const [status, setStatus] = useState<ProgressFlowStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stopTimer();
    setStatus('running');
    setProgress(8);
    setActiveStepIndex(0);

    timerRef.current = setInterval(() => {
      setProgress((currentProgress) => {
        const nextProgress = clamp(
          currentProgress + Math.max(1.5, (holdAt - currentProgress) * 0.08),
          holdAt,
        );
        const nextStepIndex = safeSteps.reduce(
          (lastMatchingIndex, step, index) =>
            nextProgress >= Math.min(step.targetProgress, holdAt) ? index : lastMatchingIndex,
          0,
        );
        setActiveStepIndex(Math.max(0, nextStepIndex));
        return nextProgress;
      });
    }, intervalMs);
  }, [holdAt, intervalMs, safeSteps, stopTimer]);

  const succeed = useCallback(() => {
    stopTimer();
    setActiveStepIndex(safeSteps.length - 1);
    setProgress(100);
    setStatus('success');
  }, [safeSteps.length, stopTimer]);

  const fail = useCallback(() => {
    stopTimer();
    setStatus('failed');
  }, [stopTimer]);

  const reset = useCallback(() => {
    stopTimer();
    setStatus('idle');
    setProgress(0);
    setActiveStepIndex(0);
  }, [stopTimer]);

  useEffect(() => stopTimer, [stopTimer]);

  return {
    activeStep: safeSteps[activeStepIndex] ?? safeSteps[0],
    activeStepIndex,
    fail,
    progress,
    reset,
    start,
    status,
    steps: safeSteps,
    succeed,
  };
}
