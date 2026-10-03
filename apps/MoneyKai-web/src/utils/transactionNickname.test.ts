import {expect,it} from 'vitest';
import {savedTransactionLabel,normalizeTransactionNickname,assertApprovedSmsBatch} from '../../../../packages/domain/src/transactionImports';
it('restores the synced nickname without replacing the source description',()=>{
  const row=JSON.parse(JSON.stringify({nickname:'My cafe',description:'Original merchant'}));
  expect(savedTransactionLabel(row)).toBe('My cafe');expect(row.description).toBe('Original merchant');
  expect(savedTransactionLabel({...row,nickname:''})).toBe('Original merchant');
});
it('permits only bounded text nicknames on the approved DTO and continues rejecting private fields',()=>{
  const transaction={id:'one',importIdentity:'a'.repeat(64),accountIdentity:'b'.repeat(64),amountMinor:1234,currency:'INR',type:'expense',semantics:'payment',category:'food',description:'Original merchant',payment_method:'upi',transaction_date:'2026-10-03',parserVersion:'sms-offline-v1',reviewStatus:'approved',captureSource:'sms',expectedRevision:0,nickname:'My cafe'};
  const batch={consentRevision:1,idempotencyKey:'one',transactions:[transaction]};
  expect(()=>assertApprovedSmsBatch(batch)).not.toThrow();
  expect(()=>assertApprovedSmsBatch({...batch,transactions:[{...transaction,rawSms:'private'}]})).toThrow();
  expect(()=>assertApprovedSmsBatch({...batch,transactions:[{...transaction,nickname:'x'.repeat(101)}]})).toThrow();
  expect(normalizeTransactionNickname('  My   cafe ')).toBe('My cafe');
});
