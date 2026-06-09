import { describe, expect, it } from 'vitest';
import { CAPTURE_FIXTURES } from '@/services/__fixtures__/captureFixtures';
import { buildCaptureDedupeKey, normalizeMerchantKey, parseCapturedSignal } from '@/services/captureParser';

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
