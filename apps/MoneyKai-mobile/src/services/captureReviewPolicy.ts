import type { CaptureParseResult, CaptureSource } from '@/types/capture';

export interface CaptureReviewDecision {
  reviewRequired: boolean;
  approvedCategory?: string;
  suggestedCategory?: string;
}

export const getCaptureReviewDecision = (
  parsed: Pick<CaptureParseResult, 'category' | 'safeToAutoRecord'>,
  source: Exclude<CaptureSource, 'manual'>,
  autoAddEnabled = false
): CaptureReviewDecision => {
  const mayAdd = source === 'sms' && autoAddEnabled && parsed.safeToAutoRecord === true && Boolean(parsed.category);
  return { reviewRequired: !mayAdd, approvedCategory: mayAdd ? parsed.category : undefined, suggestedCategory: parsed.category };
};
