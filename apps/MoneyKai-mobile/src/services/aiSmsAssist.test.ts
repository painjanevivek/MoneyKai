import { describe, expect, it } from 'vitest';
import { INDIA_BANK_ALIAS_RECORDS, hasKnownIndianBankSignal } from '@/constants/indiaBankAliases';
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
  it('loads the full India bank alias list used to ground AI bank claims', () => {
    expect(INDIA_BANK_ALIAS_RECORDS).toHaveLength(124);
    expect(hasKnownIndianBankSignal('HDFC Bank')).toBe(true);
    expect(hasKnownIndianBankSignal('ICICI')).toBe(true);
    expect(hasKnownIndianBankSignal('Federal Bank')).toBe(true);
    expect(hasKnownIndianBankSignal('Punjab National Bank')).toBe(true);
    expect(hasKnownIndianBankSignal('Kotak')).toBe(true);
  });

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

  it('accepts grounded credit-card spend classifications with card instrument details', () => {
    const input = redactSmsForAiAssist({
      source: 'sms',
      sender: 'AD-HDFCBK',
      body: 'INR 1,250.00 spent on HDFC Bank Credit Card XX1002 at BOOKMYSHOW on 09-Jun.',
      receivedAt: '2026-06-09T10:18:00.000Z',
    });

    expect(validateAiSmsParseCandidate({
      status: 'transaction',
      type: 'expense',
      amount: 1250,
      currency: 'INR',
      merchantOrCounterparty: 'BOOKMYSHOW',
      paymentMethod: 'card',
      instrument: 'credit_card',
      bankRail: 'card',
      cardDirection: 'debit',
      bankName: 'HDFC Bank',
      categorySuggestion: 'entertainment',
      transactionReferencePresent: false,
      confidence: 0.88,
      reason: 'Spend and credit-card text are present',
    }, input)).toEqual({
      accepted: true,
      reviewRequired: true,
      reasons: [],
    });
  });

  it('rejects scam-like KYC link text even when an AI candidate claims a transaction', () => {
    const input = redactSmsForAiAssist({
      source: 'sms',
      sender: 'VM-HDFCBK',
      body: 'Urgent: HDFC Bank KYC blocked. Verify account at https://bit.ly/bank-now to release Rs 5000 reward points before expiry.',
      receivedAt: '2026-06-09T10:18:00.000Z',
    });

    expect(validateAiSmsParseCandidate({
      status: 'transaction',
      type: 'income',
      amount: 5000,
      currency: 'INR',
      merchantOrCounterparty: 'HDFC Bank',
      paymentMethod: 'bank',
      instrument: 'bank_transfer',
      bankRail: 'unknown',
      bankName: 'HDFC Bank',
      transactionReferencePresent: false,
      confidence: 0.8,
      reason: 'Mentions reward amount',
    }, input).reasons).toContain('transaction must not be OTP, scam, ad, pending, service, or card-payment-confirmation text');
  });

  it('rejects pending cheque clearing but accepts cleared cheque deposits', () => {
    const pendingInput = redactSmsForAiAssist({
      source: 'sms',
      sender: 'AD-HDFCBK',
      body: 'Dear Customer, Chq No. 047568 for INR 3500.00 received for a/c XX0535 and sent for clearing.',
      receivedAt: '2026-06-09T10:18:00.000Z',
    });
    const clearedInput = redactSmsForAiAssist({
      source: 'sms',
      sender: 'AD-HDFCBK',
      body: 'Dear Customer, Chq No.047568 has been cleared. INR. 3500.00 deposited to a/c. XX0535',
      receivedAt: '2026-06-10T10:18:00.000Z',
    });
    const chequeCandidate = {
      status: 'transaction' as const,
      type: 'income' as const,
      amount: 3500,
      currency: 'INR' as const,
      merchantOrCounterparty: 'Cheque deposit',
      paymentMethod: 'bank',
      instrument: 'cheque' as const,
      bankRail: 'cheque' as const,
      bankName: 'HDFC Bank',
      transactionReferencePresent: false,
      confidence: 0.81,
      reason: 'Cheque amount present',
    };

    expect(validateAiSmsParseCandidate(chequeCandidate, pendingInput).accepted).toBe(false);
    expect(validateAiSmsParseCandidate(chequeCandidate, clearedInput).accepted).toBe(true);
  });
});
