import { describe, expect, it } from 'vitest';
import { CAPTURE_FIXTURES } from '@/services/__fixtures__/captureFixtures';
import { runCaptureParserEval } from '@/services/captureParserEval';

describe('runCaptureParserEval', () => {
  it('summarizes parser fixture quality with field-level metrics', () => {
    const metrics = runCaptureParserEval();

    expect(metrics.total).toBe(CAPTURE_FIXTURES.length);
    expect(metrics.failed).toBe(0);
    expect(metrics.passRate).toBe(1);
    expect(metrics.status.draft.expected).toBeGreaterThan(0);
    expect(metrics.status.ignore.expected).toBeGreaterThan(0);
    expect(metrics.fields.amount.checked).toBeGreaterThan(0);
    expect(metrics.fields.shouldDraft.rate).toBe(1);
  });

  it('reports actionable failures for bad labels', () => {
    const fixture = {
      ...CAPTURE_FIXTURES[0],
      expected: {
        ...CAPTURE_FIXTURES[0].expected,
        amount: 12345,
      },
    };

    const metrics = runCaptureParserEval([fixture]);

    expect(metrics.failed).toBe(1);
    expect(metrics.failures[0].id).toBe(fixture.id);
    expect(metrics.failures[0].failures.join(' ')).toContain('amount expected');
  });
});
