import { describe, expect, it } from 'vitest';
import weights from './models/offlineSmsModel.json';
import { getOfflineSmsDecision, predictOfflineSms, type OfflineSmsModel } from './offlineSmsEngine';
import { readFileSync } from 'node:fs';

const model = weights as unknown as OfflineSmsModel;
const fixtures = JSON.parse(readFileSync(new URL('../../../../datasets/sms-parser-v1/offline-model/parity_fixtures.json', import.meta.url), 'utf8'));

describe('offline SMS CRF', () => {
  it('matches Python inference on every validation and test record', () => {
    for (const fixture of fixtures) {
      const got = predictOfflineSms(model, fixture.text);
      expect(got.target, fixture.id).toEqual(fixture.prediction.target);
      expect(got.evidence, fixture.id).toEqual(fixture.prediction.evidence);
      expect(got.warnings, fixture.id).toEqual(fixture.prediction.warnings);
      expect(got.score, fixture.id).toBeCloseTo(fixture.prediction.score, 8);
    }
  }, 60000);
  it('has no production auto-post switch', () => {
    expect(model.release_enabled).toBe(false);
    expect(getOfflineSmsDecision(model, { target: { message_type: 'transaction' }, evidence: {}, score: 1, warnings: ['invalid_amount'] })).toBe('abstain');
  });
  it('bounds input work and does not substitute balance for a transaction', () => {
    expect(predictOfflineSms(model, 'x'.repeat(4097)).warnings).toContain('input_limit');
    expect(getOfflineSmsDecision(model, predictOfflineSms(model, 'Available balance Rs.200000. No payments made.'))).not.toBe('review');
  });
  it.each([
    'OTP 987654 to pay Rs.500. Do not share.',
    'Your payment of Rs.500 has failed. Available balance Rs.9000.',
    'Your payment of Rs.500 is pending.',
    'Rs.500 will be credited once processed.',
    'Your EMI of Rs.500 is due on 12/10/2026.',
    'Your UPI request for Rs.500 was received. Please approve.',
  ])('does not admit unsafe completion: %s', text => {
    expect(getOfflineSmsDecision(model, predictOfflineSms(model, text))).not.toBe('review');
  });
});
