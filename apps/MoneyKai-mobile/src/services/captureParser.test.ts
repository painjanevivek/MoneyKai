import { describe, expect, it } from 'vitest';
import { CAPTURE_FIXTURES } from '@/services/__fixtures__/captureFixtures';
import { getDraftCategoryOptions } from '@/services/captureCategoryRules';
import { buildCaptureDedupeKey, normalizeMerchantKey, parseCapturedSignal } from '@/services/captureParser';
import type { DraftTransaction } from '@/types/capture';

describe('parseCapturedSignal', () => {
  it.each(CAPTURE_FIXTURES)('$id: $label', (fixture) => {
    const parsed = parseCapturedSignal(fixture.input);

    expect(parsed.parseStatus).toBe(fixture.expected.status);

    if (fixture.expected.amount !== undefined) {
      expect(parsed.amount).toBeCloseTo(fixture.expected.amount);
    } else if (fixture.expected.shouldDraft) {
      expect(parsed.amount).toBeUndefined();
    }

    if (fixture.expected.merchant) {
      expect(parsed.merchantLabel).toBe(fixture.expected.merchant);
      expect(parsed.merchantKey).toBe(normalizeMerchantKey(fixture.expected.merchant));
    }

    if (fixture.expected.type) {
      expect(parsed.type).toBe(fixture.expected.type);
    }

    if (fixture.expected.paymentMethod) {
      expect(parsed.paymentMethod).toBe(fixture.expected.paymentMethod);
    }

    if (fixture.expected.category) {
      expect(parsed.category).toBe(fixture.expected.category);
    }

    if (fixture.expected.ignoreReasonIncludes) {
      expect(parsed.ignoreReason?.toLowerCase()).toContain(fixture.expected.ignoreReasonIncludes);
    }
  });
});

describe('parse explanation privacy', () => {
  it('redacts sensitive identifiers from safe snippets and summarizes references', () => {
    const parsed = parseCapturedSignal({
      source: 'notification',
      sourceApp: 'Bank App',
      title: 'Debit Alert',
      body: 'A/c XX4321 debited by Rs 999.00 for UPI payment to TEST SHOP. UPI Ref 412345678901.',
      receivedAt: '2026-06-09T09:00:00.000Z',
    });

    expect(parsed.explanation.safeSnippet).not.toContain('XX4321');
    expect(parsed.explanation.safeSnippet).not.toContain('412345678901');
    expect(parsed.explanation.dedupeReference).toBe('ref-8901');
  });

  it('redacts sensitive SMS identifiers even when the SMS is ignored', () => {
    const parsed = parseCapturedSignal({
      source: 'sms',
      sender: 'HDFCBK',
      body: 'OTP 123456 for A/c XX4321 UPI payment of Rs 999.00 to TEST SHOP from user@upi. UPI Ref 412345678901.',
      receivedAt: '2026-06-09T09:00:00.000Z',
    });

    expect(parsed.parseStatus).toBe('ignore');
    expect(parsed.explanation.safeSnippet).not.toContain('123456');
    expect(parsed.explanation.safeSnippet).not.toContain('XX4321');
    expect(parsed.explanation.safeSnippet).not.toContain('user@upi');
    expect(parsed.explanation.safeSnippet).not.toContain('412345678901');
  });

  it('marks hidden notification content as privacy-blocked instead of parsing it', () => {
    const parsed = parseCapturedSignal({
      source: 'notification',
      sourceApp: 'Messages',
      title: 'Axis Bank',
      body: 'Notification content hidden by Android privacy settings',
      receivedAt: '2026-06-09T09:00:00.000Z',
    });

    expect(parsed.parseStatus).toBe('ignore');
    expect(parsed.ignoreReason).toContain('hidden');
    expect(parsed.amount).toBeUndefined();
  });
});

describe('app category rules', () => {
  it.each(['ZOMATO', 'SWIGGY'])('auto-categorizes %s captures as food', (merchant) => {
    const parsed = parseCapturedSignal({
      source: 'sms',
      sender: 'AX-HDFCBK',
      body: `A/c XX4321 debited by Rs 299.00 for UPI payment to ${merchant}. UPI Ref 412345678901.`,
      receivedAt: '2026-06-09T09:00:00.000Z',
    });

    expect(parsed.parseStatus).toBe('draft');
    expect(parsed.category).toBe('food');
  });

  it('limits quick commerce draft category choices to food, electronics, and miscellaneous', () => {
    const options = getDraftCategoryOptions({
      id: 'draft_1',
      signalId: 'signal_1',
      user_id: 'local',
      type: 'expense',
      amount: 599,
      description: 'Blinkit',
      merchantKey: 'blinkit',
      payment_method: 'upi',
      transaction_date: '2026-06-09',
      confidence: 0.72,
      captureSource: 'sms',
      status: 'pending',
      createdAt: '2026-06-09T09:00:00.000Z',
    } satisfies DraftTransaction);

    expect(options.map((option) => option.id)).toEqual(['food', 'electronics', 'others']);
  });
});

describe('real bank SMS variants', () => {
  it('ignores SBI feedback messages that mention a transaction but are not transactions', () => {
    const parsed = parseCapturedSignal({
      source: 'sms',
      sender: 'AD-CBSSBI-S',
      body: 'Dear Customer, Thank you for the transaction done today at SBI 20452 branch. Plz share your experience on https://crh.sbi.bank.in/nps?CH=Branch&TD=05/06/26&TT=123456&JNo=987654. The feedback may be provided before 8 am tomorrow. No Personal Information would be captured.-SBI',
      receivedAt: '2026-06-05T10:00:00.000Z',
    });

    expect(parsed.parseStatus).toBe('ignore');
    expect(parsed.ignoreReason?.toLowerCase()).toContain('feedback');
    expect(parsed.amount).toBeUndefined();
  });

  it('keeps cheque withdrawal SMS as a reviewable expense draft', () => {
    const parsed = parseCapturedSignal({
      source: 'sms',
      sender: 'JK-CBSSBI-S',
      body: 'Dear Customer, Your A/C XX1234 has a withdrawal by Cheque of Rs 72,466.72 on 16/05/26. Avl Bal Rs 1,23,456.78-SBI',
      receivedAt: '2026-05-16T10:00:00.000Z',
    });

    expect(parsed.parseStatus).toBe('review');
    expect(parsed.type).toBe('expense');
    expect(parsed.amount).toBeCloseTo(72466.72);
  });

  it('reads SBI UPI debit amounts even when the SMS omits Rs or INR', () => {
    const parsed = parseCapturedSignal({
      source: 'sms',
      sender: 'AX-SBIUPI-S',
      body: 'Dear UPI user A/C X6173 debited by 23000.00 on date 04Jun26 trf to VIVEK NARESH PAI Refno 512345678901 If not u? call-1800111109 for other services-SBI',
      receivedAt: '2026-06-04T10:00:00.000Z',
    });

    expect(['draft', 'review']).toContain(parsed.parseStatus);
    expect(parsed.type).toBe('expense');
    expect(parsed.amount).toBeCloseTo(23000);
  });
});

describe('normalizeMerchantKey', () => {
  it('strips noisy suffixes while keeping useful merchant words', () => {
    expect(normalizeMerchantKey('PHASE ONE CAFE UPI Ref 123456')).toBe('phase one cafe');
    expect(normalizeMerchantKey('Amazon Pay India Pvt Ltd')).toBe('amazon');
  });
});

describe('buildCaptureDedupeKey', () => {
  it('collapses repeated notifications with the same transaction reference', () => {
    const original = CAPTURE_FIXTURES.find((fixture) => fixture.id === 'upi-hdfc-cafe-debit');
    const duplicate = CAPTURE_FIXTURES.find((fixture) => fixture.id === 'duplicate-hdfc-upi-cafe');

    expect(original).toBeDefined();
    expect(duplicate).toBeDefined();

    if (!original || !duplicate) return;

    const originalParsed = parseCapturedSignal(original.input);
    const duplicateParsed = parseCapturedSignal(duplicate.input);

    expect(buildCaptureDedupeKey(original.input, originalParsed)).toBe(
      buildCaptureDedupeKey(duplicate.input, duplicateParsed)
    );
  });

  it('keeps repeated same-amount transactions distinct when no reference is shared outside the time bucket', () => {
    const input = {
      source: 'notification' as const,
      sourceApp: 'Google Pay',
      title: 'Payment successful',
      body: 'You paid Rs 120 to COFFEE BAR via UPI.',
      receivedAt: '2026-06-09T09:00:00.000Z',
    };
    const laterInput = {
      ...input,
      receivedAt: '2026-06-09T09:31:00.000Z',
    };

    expect(buildCaptureDedupeKey(input, parseCapturedSignal(input))).not.toBe(
      buildCaptureDedupeKey(laterInput, parseCapturedSignal(laterInput))
    );
  });
});
