import { describe, expect, it } from 'vitest';
import { buildSmsImportProgressFlow, perceivedProgress } from './progressIllusion';

describe('progressIllusion', () => {
  it('never reports complete before server/native completion', () => {
    expect(perceivedProgress({ floor: 70, ceiling: 88, signal: 100 })).toBe(88);
    expect(
      buildSmsImportProgressFlow({
        phase: 'importing_transactions',
        scannedCount: 250,
        eligibleCount: 80,
        draftedCount: 20,
        duplicateCount: 4,
        parserIgnoredCount: 0,
        pageCount: 8,
      }).progress,
    ).toBeLessThan(100);
  });

  it('moves to success only when the task reports complete', () => {
    const state = buildSmsImportProgressFlow({
      phase: 'complete',
      scannedCount: 40,
      eligibleCount: 10,
      draftedCount: 4,
      duplicateCount: 1,
      parserIgnoredCount: 3,
      pageCount: 2,
    });

    expect(state.status).toBe('success');
    expect(state.progress).toBe(100);
    expect(state.steps.every((step) => step.status === 'complete')).toBe(true);
  });

  it('keeps failed state actionable without jumping to 100', () => {
    const state = buildSmsImportProgressFlow(undefined, 'Android denied SMS inbox access.');

    expect(state.status).toBe('failed');
    expect(state.progress).toBeLessThan(100);
    expect(state.steps.some((step) => step.status === 'failed')).toBe(true);
  });
});
