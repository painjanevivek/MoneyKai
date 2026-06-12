import { describe, expect, it } from 'vitest';
import { getCaptureReviewDecision } from '@/services/captureReviewPolicy';

describe('capture review policy', () => {
  it('keeps parser category as a suggestion for SMS drafts', () => {
    expect(getCaptureReviewDecision({ category: 'food' }, 'sms')).toEqual({
      reviewRequired: true,
      approvedCategory: undefined,
      suggestedCategory: 'food',
    });
  });

  it('requires review for notification drafts too', () => {
    expect(getCaptureReviewDecision({ category: 'shopping' }, 'notification')).toEqual({
      reviewRequired: true,
      approvedCategory: undefined,
      suggestedCategory: 'shopping',
    });
  });
});
