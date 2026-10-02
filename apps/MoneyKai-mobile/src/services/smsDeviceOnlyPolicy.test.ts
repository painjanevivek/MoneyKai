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
  it('permits only the approved DTO on its versioned consent-controlled batch route', () => {
    const row={id:'sms_1',importIdentity:'a'.repeat(64),accountIdentity:'b'.repeat(64),amountMinor:100,currency:'INR',type:'expense',semantics:'payment',category:'Other',description:'Merchant',payment_method:'UPI',transaction_date:'2026-10-02',parserVersion:'sms-offline-v1',reviewStatus:'approved',captureSource:'sms',expectedRevision:0};
    const batch={consentRevision:1,idempotencyKey:'batch',transactions:[row]};
    expect(()=>assertCloudRouteAllowed('/v1/transaction-imports/history/batches',JSON.stringify(batch))).not.toThrow();
    for(const change of [{body:'private'}, {snippet:'private'}, {inboxId:'123'}, {reviewStatus:'pending'}, {captureSource:'notification'}])
      expect(()=>assertCloudRouteAllowed('/v1/transaction-imports/history/batches',JSON.stringify({...batch,transactions:[{...row,...change}]}))).toThrow();
    expect(()=>assertCloudRouteAllowed('/v1/resources/transactions',JSON.stringify(batch))).toThrow();
  });
});
