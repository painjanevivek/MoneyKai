import type { CaptureParseResult, CaptureSource } from '@/types/capture';

export interface CaptureReviewDecision {
  reviewRequired: boolean;
  approvedCategory?: string;
  suggestedCategory?: string;
}

export const getCaptureReviewDecision = (
  parsed: Pick<CaptureParseResult, 'category'>,
  source: Exclude<CaptureSource, 'manual'>
): CaptureReviewDecision => ({
  reviewRequired: source === 'sms' || source === 'notification' || source === 'aa',
  approvedCategory: undefined,
  suggestedCategory: parsed.category,
});
