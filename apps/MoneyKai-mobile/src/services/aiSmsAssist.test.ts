import { describe, expect, it } from 'vitest';
import { parseCapturedSignal } from '@/services/captureParser';
import {
  redactSmsForAiAssist,
  shouldUseAiSmsFallback,
  validateAiSmsParseCandidate,
} from '@/services/aiSmsAssist';
import type { CaptureSettings } from '@/types/capture';

const baseSettings: CaptureSettings = {
  autoCaptureEnabled: true,
  notificationCaptureEnabled: true,
  reviewNotificationsEnabled: true,
  smsResearchModeEnabled: true,
  aiSmsAssistEnabled: true,
  notificationAccessStatus: 'unknown',
  smsAccessStatus: 'unknown',
};

describe('AI SMS assist safety layer', () => {
  it('redacts sensitive identifiers before an AI fallback payload is built', () => {
    const payload = redactSmsForAiAssist({
      source: 'sms',
      sender: 'AX-HDFCBK',
      body: 'A/c XX4321 debited by Rs 1.00 to AKSHAY PAINJANE user@upi. UPI Ref 412345678901. OTP 123456.',
      receivedAt: '2026-06-09T10:00:00.000Z',
    });

    expect(payload.body).not.toContain('XX4321');
    expect(payload.body).not.toContain('user@upi');
    expect(payload.body).not.toContain('412345678901');
    expect(payload.body).not.toContain('123456');
    expect(payload.body).toContain('[masked]');
    expect(payload.body).toContain('[vpa]');
    expect(payload.body).toContain('[ref]');
  });

  it('only routes SMS review or low-confidence parser output to AI fallback when enabled', () => {
    const parsed = parseCapturedSignal({
      source: 'sms',
      sender: 'SBIBNK',
      body: 'Your account was debited by Rs 999.00. Ref 111122223333.',
      receivedAt: '2026-06-09T10:22:00.000Z',
    });

    expect(parsed.parseStatus).toBe('review');
    expect(shouldUseAiSmsFallback(baseSettings, {
      source: 'sms',
      sender: 'SBIBNK',
      body: 'Your account was debited by Rs 999.00. Ref 111122223333.',
      receivedAt: '2026-06-09T10:22:00.000Z',
    }, parsed)).toBe(true);
    expect(shouldUseAiSmsFallback({ ...baseSettings, aiSmsAssistEnabled: false }, {
      source: 'sms',
      sender: 'SBIBNK',
      body: 'Your account was debited by Rs 999.00. Ref 111122223333.',
      receivedAt: '2026-06-09T10:22:00.000Z',
    }, parsed)).toBe(false);
  });

  it('rejects AI candidates that are not grounded in the redacted message', () => {
    const input = redactSmsForAiAssist({
      source: 'sms',
      sender: 'AX-HDFCBK',
      body: 'A/c XX4321 debited by Rs 1.00 for UPI payment to PERSON_A. UPI Ref 412345678901.',
      receivedAt: '2026-06-09T10:00:00.000Z',
    });

    expect(validateAiSmsParseCandidate({
      status: 'transaction',
      type: 'income',
      amount: 50,
      currency: 'INR',
      merchantOrCounterparty: 'PERSON_A',
      paymentMethod: 'upi',
      categorySuggestion: 'food',
      transactionReferencePresent: true,
      confidence: 0.82,
      reason: 'Looks like a payment',
    }, input)).toEqual({
      accepted: false,
      reviewRequired: true,
      reasons: expect.arrayContaining([
        'amount must be present in the redacted message',
        'income direction must be supported by message text',
      ]),
    });
  });
});
