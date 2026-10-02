import { describe, expect, it } from 'vitest';
import { previewManualSms } from './manualSmsPreview';

const sms = 'Rs 789.50 debited from account XX1234 for UPI payment to PHASE ONE CAFE. UPI Ref 412345678901.';
const now = new Date('2026-09-30T09:00:00Z');
describe('manual SMS parser boundary', () => {
  it('returns only reviewed transaction fields, not the body, credentials or derived raw-message identifiers', () => {
    const preview = previewManualSms(sms, now);
    expect(preview?.amount).toBe(789.5);
    expect(preview?.type).toBe('expense');
    expect(preview?.description).toBe('PHASE ONE CAFE');
    expect(Object.keys(preview!)).toEqual(['type', 'amount', 'category', 'description', 'counterpartyName', 'counterpartyKind', 'payment_method', 'transaction_date', 'captureSource']);
    for (const sensitive of ['XX1234', '412345678901', sms]) expect(JSON.stringify(preview)).not.toContain(sensitive);
  });
  it.each([
    '', 'See you at dinner tomorrow', 'Your OTP is 123456 for payment of Rs 1000. Do not share.',
    'Your UPI PIN is 1234. Payment of Rs 1000 requested.',
    'Your transaction of Rs 500 failed at SHOP.', 'Get a loan of Rs 50000, apply now.',
  ])('discards non-completed or security message: %s', (body) => expect(previewManualSms(body, now)).toBeNull());
  it('rejects oversized pasted input', () => expect(previewManualSms(sms.repeat(200), now)).toBeNull());
  it('uses the payment amount rather than an available balance placed first', () => {
    const preview = previewManualSms('Avl Bal Rs 12000.00. Rs 450.00 debited from A/c XX1234 for UPI payment to TEST CAFE.', now);
    expect(preview?.amount).toBe(450);
  });
  it('does not use the balance as an amount when the payment amount is missing', () => {
    expect(previewManualSms('UPI payment debited from account XX1234. Available balance: Rs 12000.00.', now)).toBeNull();
  });
  it.each([
    'Rs 450 will be credited to your account once processed.',
    'Your payment of Rs 450 to TEST CAFE has been initiated.',
    'AED 450 debited from account XX1234 for payment to TEST CAFE.',
  ])('does not offer an unfinished or unsupported-currency payment as an INR transaction: %s', (body) => {
    expect(previewManualSms(body, now)).toBeNull();
  });
  it('handles a sustained 1000-message parsing burst without cross-message state', () => {
    for (let i = 0; i < 1000; i += 1) {
      expect(previewManualSms(sms, now)?.amount).toBe(789.5);
      expect(previewManualSms(`Family message ${i}`, now)).toBeNull();
    }
  });
});
