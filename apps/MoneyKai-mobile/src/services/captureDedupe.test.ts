import { describe, expect, it } from 'vitest';
import { buildCaptureDedupeKeys } from '@/services/captureDedupe';
import { parseCapturedSignal } from '@/services/captureParser';

describe('capture dedupe keys', () => {
  it('matches redacted SMS and app alerts by their native reference digest', () => {
    const body = 'You paid Rs 150 to Corner Cafe via UPI. Ref [ref].';
    const sms = { source: 'sms' as const, body, rawPayload: { smsReferenceHash: 'a'.repeat(64) } };
    const notification = { source: 'notification' as const, body: 'You paid Rs 150 via UPI. Ref [ref].', sourceApp: 'Google Pay', rawPayload: { notificationReferenceHash: 'a'.repeat(64) } };
    expect(buildCaptureDedupeKeys(sms, parseCapturedSignal(sms)).canonicalTransactionKey).toBe(buildCaptureDedupeKeys(notification, parseCapturedSignal(notification)).canonicalTransactionKey);
  });
  it('does not drop two different native alerts without a reference in the same time bucket', () => {
    const first = { source: 'notification' as const, body: 'You paid Rs 150 to Corner Cafe via UPI.', receivedAt: '2026-09-30T10:01:00Z', rawPayload: { notificationId: 'a'.repeat(64) } };
    const next = { ...first, rawPayload: { notificationId: 'b'.repeat(64) } };
    expect(buildCaptureDedupeKeys(first, parseCapturedSignal(first)).canonicalTransactionKey).not.toBe(buildCaptureDedupeKeys(next, parseCapturedSignal(next)).canonicalTransactionKey);
    expect(buildCaptureDedupeKeys(first, parseCapturedSignal(first))).toEqual(buildCaptureDedupeKeys({ ...first }, parseCapturedSignal(first)));
  });
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
    const notificationKeys = buildCaptureDedupeKeys(notificationInput, parseCapturedSignal(notificationInput), 'sms:hdfcbk:ending4321');

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
  it('keeps different accounts and same-amount payments without reliable references', () => {
    const input = { source: 'sms' as const, sender: 'AX-HDFCBK', body: 'Rs 150 debited for payment to Corner Cafe.', receivedAt: '2026-10-02T10:00:00Z', rawPayload: { smsMessageId: '1', smsReferenceHash: 'a'.repeat(64) } };
    const parsed = parseCapturedSignal(input);
    expect(buildCaptureDedupeKeys(input,parsed,'account-a').canonicalTransactionKey).not.toBe(buildCaptureDedupeKeys(input,parsed,'account-b').canonicalTransactionKey);
    const first = { ...input, rawPayload: { smsMessageId: '1' } };
    const second = { ...input, rawPayload: { smsMessageId: '2' } };
    expect(buildCaptureDedupeKeys(first,parseCapturedSignal(first)).canonicalTransactionKey).not.toBe(buildCaptureDedupeKeys(second,parseCapturedSignal(second)).canonicalTransactionKey);
  });
  it('does not mask distinct numeric references into the same duplicate key', () => {
    const first = { source: 'sms' as const, body: 'Rs 150 debited for payment to Corner Cafe. UPI Ref 123456789012.' };
    const second = { ...first, body: first.body.replace('123456789012','987654321012') };
    expect(buildCaptureDedupeKeys(first,parseCapturedSignal(first)).canonicalTransactionKey).not.toBe(buildCaptureDedupeKeys(second,parseCapturedSignal(second)).canonicalTransactionKey);
  });
});
