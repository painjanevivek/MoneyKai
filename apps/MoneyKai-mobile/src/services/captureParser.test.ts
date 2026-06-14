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
  it('uses reliable SMS body transaction dates when they are not future-dated', () => {
    const parsed = parseCapturedSignal({
      source: 'sms',
      sender: 'AXISBK',
      body: 'INR 293.00 debited A/c no. XX8690 09-06-26, 15:21:54 UPI/P2M/652670076603/SWIGGY INSTAMART PR Axis Bank',
      receivedAt: '2026-06-10T20:05:19.781Z',
    });

    expect(parsed.transactionDate).toBe('2026-06-09');
    expect(parsed.explanation.matchedTransactionDatePattern).toContain('dd-mm-yy');
    expect(parsed.explanation.confidenceFactors).toContain('reliable transaction date found');
  });

  it('does not use future-dated SMS body dates as transaction dates', () => {
    const parsed = parseCapturedSignal({
      source: 'sms',
      sender: 'AXISBK',
      body: 'INR 293.00 debited A/c no. XX8690 11-06-26, 15:21:54 UPI/P2M/652670076603/SWIGGY INSTAMART PR Axis Bank',
      receivedAt: '2026-06-10T08:05:19.781Z',
    });

    expect(parsed.transactionDate).toBeUndefined();
  });

  it.each([
    ['UPI Ref', 'UPI Ref 412345678901.', '412345678901'],
    ['UTR', 'UTR 512345678901.', '512345678901'],
    ['RRN', 'RRN 612345678901.', '612345678901'],
    ['transaction id', 'Transaction ID T250610123456.', 't250610123456'],
    ['IMPS ref', 'IMPS Ref IMPS123456789.', 'imps123456789'],
    ['Refno', 'Refno 712345678901.', '712345678901'],
  ])('extracts %s references for dedupe', (_label, referenceText, expectedReference) => {
    const parsed = parseCapturedSignal({
      source: 'sms',
      sender: 'AX-HDFCBK',
      body: `A/c XX4321 debited by Rs 1.00 for UPI payment to AKSHAY PAINJANE. ${referenceText}`,
      receivedAt: '2026-06-09T12:00:00.000Z',
    });

    expect(parsed.transactionReference).toBe(expectedReference);
  });

  it('dedupes repeated Akshay Painjane Rs 1 SMS by transaction reference', () => {
    const input = {
      source: 'sms' as const,
      sender: 'AX-HDFCBK',
      body: 'A/c XX4321 debited by Rs 1.00 for UPI payment to AKSHAY PAINJANE. UPI Ref 412345678901.',
      receivedAt: '2026-06-09T12:00:00.000Z',
    };
    const repeatedInput = {
      ...input,
      receivedAt: '2026-06-09T12:01:00.000Z',
    };

    expect(buildCaptureDedupeKey(input, parseCapturedSignal(input))).toBe(
      buildCaptureDedupeKey(repeatedInput, parseCapturedSignal(repeatedInput))
    );
  });

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

  it('parses completed cheque withdrawal SMS as a bank transaction', () => {
    const parsed = parseCapturedSignal({
      source: 'sms',
      sender: 'JK-CBSSBI-S',
      body: 'Dear Customer, Your A/C XX1234 has a withdrawal by Cheque of Rs 72,466.72 on 16/05/26. Avl Bal Rs 1,23,456.78-SBI',
      receivedAt: '2026-05-16T10:00:00.000Z',
    });

    expect(parsed.parseStatus).toBe('draft');
    expect(parsed.type).toBe('expense');
    expect(parsed.amount).toBeCloseTo(72466.72);
    expect(parsed.paymentMethod).toBe('bank');
    expect(parsed.merchantLabel).toBe('withdrawal by Cheque');
  });

  it('ignores pending cheque clearing messages until the bank confirms clearing', () => {
    const parsed = parseCapturedSignal({
      source: 'sms',
      sender: 'ADIB',
      body: 'Dear Customer, Chq No. 047568 for INR 3500.00 received for a/c ****0535 and sent for clearing. We will inform you once the Chq is cleared. Thank you',
      receivedAt: '2022-05-20T08:07:48.000Z',
    });

    expect(parsed.parseStatus).toBe('ignore');
    expect(parsed.ignoreReason?.toLowerCase()).toContain('pending cheque');
  });

  it('parses cleared cheque deposits as bank income', () => {
    const parsed = parseCapturedSignal({
      source: 'sms',
      sender: 'ADIB',
      body: 'Dear Customer, Chq No.047568 has been cleared. INR. 3500.00 deposited to a/c. ****0535',
      receivedAt: '2022-05-21T08:07:48.000Z',
    });

    expect(parsed.parseStatus).toBe('review');
    expect(parsed.type).toBe('income');
    expect(parsed.amount).toBeCloseTo(3500);
    expect(parsed.paymentMethod).toBe('bank');
    expect(parsed.transactionReference).toBe('047568');
  });

  it('ignores suspicious KYC or blocked-account link messages with amounts', () => {
    const parsed = parseCapturedSignal({
      source: 'sms',
      sender: 'VM-HDFCBK',
      body: 'Urgent: HDFC Bank KYC blocked. Verify account at https://bit.ly/bank-now to release Rs 5000 reward points before expiry.',
      receivedAt: '2026-06-05T10:00:00.000Z',
    });

    expect(parsed.parseStatus).toBe('ignore');
    expect(parsed.ignoreReason?.toLowerCase()).toContain('scam');
  });

  it('ignores GST and tax messages instead of drafting a transaction', () => {
    const parsed = parseCapturedSignal({
      source: 'sms',
      sender: 'AD-HDFCBK',
      body: 'GST invoice generated for INR 1,180.00 including CGST and SGST for your recent payment.',
      receivedAt: '2026-06-05T10:00:00.000Z',
    });

    expect(parsed.parseStatus).toBe('ignore');
    expect(parsed.ignoreReason?.toLowerCase()).toContain('gst');
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

  it('reads approved card transaction dates from ADIB-style SMS messages', () => {
    const parsed = parseCapturedSignal({
      source: 'sms',
      sender: 'ADIB',
      body: 'Trx. of AED45.00 on your card ending *510 at GLOBAL VILLAGE D, UAE is Approved. Avl. card bal is 1955.00. Trx Date: 28/01/23 18:54',
      receivedAt: '2023-01-28T18:54:00.000Z',
    });

    expect(parsed.parseStatus).toBe('draft');
    expect(parsed.transactionDate).toBe('2023-01-28');
    expect(parsed.explanation.matchedTransactionDatePattern).toContain('dd/mm/yy');
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
