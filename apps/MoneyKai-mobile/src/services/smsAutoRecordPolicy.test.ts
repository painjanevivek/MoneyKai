import { describe, expect, it } from 'vitest';
import { parseCapturedSignal } from './captureParser';
import { isSafeSmsToAutoRecord, isRecognizedBankSmsSender } from './smsAutoRecordPolicy';
import { getCaptureReviewDecision } from './captureReviewPolicy';
import type { CaptureSignalInput, MerchantCategoryRule } from '@/types/capture';

const input: CaptureSignalInput = { source: 'sms', sender: 'AX-HDFCBK', receivedAt: '2026-09-30T10:00:00Z',
  body: 'A/c [masked] debited by Rs 299.00 for UPI payment to Corner Cafe on 30/09/2026. UPI Ref [ref]. Avl Bal Rs 1000.',
  rawPayload: { captureOrigin: 'android_sms_inbox_import', smsAutoRecordSafe: true, smsReferenceHash: 'a'.repeat(64), smsAccountHint: 'ending 4321', smsMessageId: 'test-only' } };

describe('selective SMS auto-add policy', () => {
  it('allows only a reliable category with explicit consent on the caller', () => {
    const parsed = parseCapturedSignal(input);
    expect(parsed.merchantLabel).toBe('Corner Cafe');
    expect(parsed.category).toBe('food');
    expect(parsed.reliableCategory).toBe(true);
    expect(parsed.safeToAutoRecord).toBe(true);
    expect(getCaptureReviewDecision(parsed, 'sms').reviewRequired).toBe(true);
    expect(getCaptureReviewDecision(parsed, 'sms', true)).toMatchObject({ reviewRequired: false, approvedCategory: 'food' });
    expect(getCaptureReviewDecision(parsed, 'notification', true).reviewRequired).toBe(true);
  });
  it.each(['AX-HDFCBK', 'AD-SBIPSG-T', 'AX-ICICIB', 'SBI', 'AXISBK'])('recognizes bank sender headers: %s', sender => expect(isRecognizedBankSmsSender(sender)).toBe(true));
  it.each(['+919876543210', 'FAKEBANK', 'BankPromo', 'http://hdfc.com'])('does not trust an unknown sender: %s', sender => expect(isRecognizedBankSmsSender(sender)).toBe(false));
  it.each([
    'pending', 'initiated', 'will be debited', 'reversed', 'refund', 'cashback', 'fraud', 'dispute',
    'USD 20', 'https://payments.example', 'and received Rs 1', 'another Rs 120 paid',
  ])('blocks ambiguous or suspicious suffix: %s', suffix => {
    const candidate = { ...input, body: `${input.body} ${suffix}` };
    expect(isSafeSmsToAutoRecord(candidate, parseCapturedSignal(candidate))).toBe(false);
  });
  it.each(['Vivek Naresh Painjane', 'Unknown Store', 'Wellness Spa', 'Swiggy Instamart', 'Cafe Medical'])('retains uncertain categorization for review: %s', name => {
    const candidate = { ...input, body: input.body.replace('Corner Cafe', name) };
    expect(parseCapturedSignal(candidate).safeToAutoRecord).toBe(false);
  });
  it('does not infer a purpose from a person-to-person transfer', () => {
    const candidate = { ...input, body: input.body.replace('Corner Cafe', 'Vivek Naresh Painjane') + ' P2P' };
    expect(parseCapturedSignal(candidate)).toMatchObject({ category: 'personal_transfer', counterpartyKind: 'person', reliableCategory: false, safeToAutoRecord: false });
  });
  it.each([
    {}, { captureOrigin: 'android_sms_inbox_import', smsAutoRecordSafe: false, smsReferenceHash: 'a'.repeat(64) },
    { captureOrigin: 'manual_paste', smsAutoRecordSafe: true, smsReferenceHash: 'a'.repeat(64) },
    { captureOrigin: 'android_sms_inbox_import', smsAutoRecordSafe: true, smsReferenceHash: '1234' },
  ])('requires complete validation of original text before redaction: %j', payload => {
    const candidate = { ...input, rawPayload: payload };
    expect(parseCapturedSignal(candidate).safeToAutoRecord).toBe(false);
  });
  it('requires an explicit valid date rather than inventing one from receipt time', () => {
    const candidate = { ...input, body: input.body.replace(' on 30/09/2026', '') };
    expect(parseCapturedSignal(candidate).safeToAutoRecord).toBe(false);
  });
  it.each(['29,9.00', '299.001', '299,', '2,9,9'])('rejects malformed monetary grouping: %s', amount => {
    const candidate = { ...input, body: input.body.replace('299.00', amount) };
    expect(parseCapturedSignal(candidate).safeToAutoRecord).toBe(false);
  });
  it('honors exact owner-confirmed rules without broad partial matches or cross-direction reuse', () => {
    const rule: MerchantCategoryRule = { id: 'r', userId: 'owner', transactionType: 'expense', merchantKey: 'corner cafe', merchantLabel: 'Corner Cafe', category: 'healthcare', source: 'manual', confidence: 1, usageCount: 1, createdAt: '', updatedAt: '' };
    expect(parseCapturedSignal(input, [rule])).toMatchObject({ category: 'healthcare', reliableCategory: true });
    const longer = { ...input, body: input.body.replace('Corner Cafe', 'Corner Cafe Medical') };
    expect(parseCapturedSignal(longer, [rule]).safeToAutoRecord).toBe(false);
    expect(parseCapturedSignal(input, [{ ...rule, transactionType: 'income' }]).category).toBe('food');
    expect(parseCapturedSignal(input, [{ ...rule, userId: undefined }]).reliableCategory).toBe(false);
  });
});
