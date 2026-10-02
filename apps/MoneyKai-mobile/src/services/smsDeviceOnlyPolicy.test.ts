import { describe, expect, it } from 'vitest';
import { assertCloudPayloadAllowed, assertCloudRouteAllowed, containsDeviceOnlyData } from './smsDeviceOnlyPolicy';
describe('SMS device-only egress boundary', () => {
  it('blocks cloud parsing regardless of user settings or redaction', () => {
    expect(() => assertCloudRouteAllowed('/v1/capture/ai-parse', '{"body":"redacted"}')).toThrow('offline');
  });
  it.each([
    { captureSource: 'sms', amount: 100 },
    { captureSource: 'notification', amount: 100 },
    { data: { transactions: [{ captureSource: 'notification' }] } },
    { signals: [{ source: 'notification', body: 'private' }] },
    { data: { transactions: [{ captureSource: 'sms' }] } },
    { signals: [{ source: 'sms', body: 'private' }] },
    { notifications: [{ localOnly: true, body: 'private' }] },
  ])('rejects private financial data in nested payloads', value => {
    expect(containsDeviceOnlyData(value)).toBe(true);
    expect(() => assertCloudPayloadAllowed(value)).toThrow('Device-only');
    expect(() => assertCloudRouteAllowed('/v1/transactions', JSON.stringify(value))).toThrow('Device-only');
  });
  it('does not serialize user data into error messages', () => {
    const secret = 'secret account 9988776655';
    try { assertCloudPayloadAllowed({ source: 'sms', body: secret }); }
    catch (error) { expect(String(error)).not.toContain(secret); }
  });
  it('does not change non-SMS cloud workflows while their scope is undecided', () => {
    expect(() => assertCloudPayloadAllowed({ captureSource: 'manual', amount: 100 })).not.toThrow();
  });
});
