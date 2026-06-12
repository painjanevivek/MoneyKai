import { describe, expect, it } from 'vitest';
import { buildCaptureDedupeKeys } from '@/services/captureDedupe';
import { parseCapturedSignal } from '@/services/captureParser';

describe('capture dedupe keys', () => {
  it('uses Android SMS message id as a stable source fingerprint', () => {
    const input = {
      source: 'sms',
      sender: 'AX-HDFCBK',
      body: 'A/c XX4321 debited by Rs 1.00 for UPI payment to AKSHAY PAINJANE. UPI Ref 555566667777.',
      receivedAt: '2026-06-09T10:00:00.000Z',
      rawPayload: { smsMessageId: '42', smsAccountHint: 'ending 4321' },
    } as const;

    const keys = buildCaptureDedupeKeys(input, parseCapturedSignal(input), 'sms:hdfcbk:ending4321');

    expect(keys.sourceFingerprint).toBe('sms-message:ax-hdfcbk:42');
  });

  it('collapses SMS and notification variants when a reference is shared', () => {
    const smsInput = {
      source: 'sms',
      sender: 'AX-HDFCBK',
      body: 'A/c XX4321 debited by Rs 1.00 for UPI payment to AKSHAY PAINJANE. UPI Ref 555566667777.',
      receivedAt: '2026-06-09T10:00:00.000Z',
      rawPayload: { smsAccountHint: 'ending 4321' },
    } as const;
    const notificationInput = {
      source: 'notification',
      sourceApp: 'HDFC Bank',
      title: 'Debit alert',
      body: 'Rs 1.00 debited from account for UPI payment to AKSHAY PAINJANE. UPI Ref 555566667777.',
      receivedAt: '2026-06-09T10:02:00.000Z',
    } as const;

    const smsKeys = buildCaptureDedupeKeys(smsInput, parseCapturedSignal(smsInput), 'sms:hdfcbk:ending4321');
    const notificationKeys = buildCaptureDedupeKeys(notificationInput, parseCapturedSignal(notificationInput));

    expect(smsKeys.canonicalTransactionKey).toBe(notificationKeys.canonicalTransactionKey);
  });

  it('keeps separate no-reference payments distinct outside the narrow time bucket', () => {
    const firstInput = {
      source: 'notification',
      sourceApp: 'Google Pay',
      title: 'Payment successful',
      body: 'You paid Rs 120 to SAME PERSON via UPI.',
      receivedAt: '2026-06-09T09:00:00.000Z',
    } as const;
    const laterInput = {
      ...firstInput,
      receivedAt: '2026-06-09T09:31:00.000Z',
    };

    const firstKeys = buildCaptureDedupeKeys(firstInput, parseCapturedSignal(firstInput));
    const laterKeys = buildCaptureDedupeKeys(laterInput, parseCapturedSignal(laterInput));

    expect(firstKeys.canonicalTransactionKey).not.toBe(laterKeys.canonicalTransactionKey);
  });
});
