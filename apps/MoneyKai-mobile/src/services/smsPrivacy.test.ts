import { describe, expect, it } from 'vitest';
import { containsLikelyRawSmsIdentifier, redactSensitiveSmsText } from '@/services/smsPrivacy';

describe('SMS privacy helpers', () => {
  it('redacts OTPs, account hints, UPI IDs, references, and long numbers', () => {
    const redacted = redactSensitiveSmsText(
      'OTP 123456 for A/c XX4321 paid to user@upi. UPI Ref 412345678901 and phone 9876543210.'
    );

    expect(redacted).not.toContain('123456');
    expect(redacted).not.toContain('XX4321');
    expect(redacted).not.toContain('user@upi');
    expect(redacted).not.toContain('412345678901');
    expect(redacted).not.toContain('9876543210');
    expect(redacted).toContain('[code]');
    expect(redacted).toContain('[masked]');
    expect(redacted).toContain('[vpa]');
    expect(redacted).toContain('[ref]');
    expect(redacted).toContain('[number]');
  });

  it('detects likely raw SMS identifiers', () => {
    expect(containsLikelyRawSmsIdentifier('UPI Ref 412345678901')).toBe(true);
    expect(containsLikelyRawSmsIdentifier('Payment to [masked] UPI Ref [ref]')).toBe(false);
  });
});
