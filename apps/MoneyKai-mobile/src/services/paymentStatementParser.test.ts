import { describe, expect, it } from 'vitest';
import { findPossibleStatementDuplicate, findStatementDuplicate, parsePaymentStatement } from './paymentStatementParser';
import type { Transaction } from '@/types/transaction';

const phonepe = `PhonePe Transaction Statement
Sep 29, 2026
08:15 AM
Paid to Corner Cafe
Transaction ID: T260929123456789
UTR No: 612345678901
Debited from account XX1122
DEBIT INR 1,250.50
Sep 30, 2026
10:30 AM
Received from Mira
Transaction ID: T260930987654321
UTR No: 698765432109
Credited to account XX1122
CREDIT INR
800.00`;

describe('payment statement import', () => {
  it('reads multiline PhonePe debit and credit columns without reading references as amounts', () => {
    const result = parsePaymentStatement(phonepe, 'phonepe');
    expect(result.skippedCount).toBe(0);
    expect(result.rows.map(({ description, amount, type, transaction_date }) => ({ description, amount, type, transaction_date }))).toEqual([
      { description: 'Corner Cafe', amount: 1250.5, type: 'expense', transaction_date: '2026-09-29' },
      { description: 'Mira', amount: 800, type: 'income', transaction_date: '2026-09-30' },
    ]);
    expect(JSON.stringify(result.rows)).not.toContain('612345678901');
  });
  it('reads date-first Google Pay rows', () => {
    const result = parsePaymentStatement('Google Pay\nSeptember 29, 2026 Paid to Cafe ₹289.50\nSeptember 30, 2026 Received from Mira ₹500.00', 'google_pay');
    expect(result.rows.map((row) => [row.amount, row.type, row.description])).toEqual([[289.5, 'expense', 'Cafe'], [500, 'income', 'Mira']]);
  });
  it('reads description-first Google Pay cards', () => {
    const result = parsePaymentStatement('Google Pay\nPaid to Cafe ₹289.50\n29 Sep 2026\nReceived from Mira ₹500\n30 Sep 2026', 'google_pay');
    expect(result.rows.map((row) => row.transaction_date)).toEqual(['2026-09-29', '2026-09-30']);
    expect(result.rows.map((row) => row.description)).toEqual(['Cafe', 'Mira']);
  });
  it('reads Paytm UPI statement rows with numeric dates and direction', () => {
    const result = parsePaymentStatement('Paytm UPI Statement\n29/09/2026 Paid to Shop INR 99.00\n30/09/2026 Received from Mira INR 400.00', 'paytm');
    expect(result.rows.map((row) => [row.transaction_date, row.amount, row.type, row.payment_method])).toEqual([
      ['2026-09-29', 99, 'expense', 'upi'], ['2026-09-30', 400, 'income', 'upi'],
    ]);
  });
  it('does not turn summary totals, pending payments or impossible dates into transactions', () => {
    const result = parsePaymentStatement('Google Pay\nTotal paid ₹9000\n2026-09-31 Paid to Cafe ₹100\n2026-09-30 Paid to Cafe ₹100 Pending\n2026-09-29 Paid to Cafe UPI ref 612345678901\n2026-09-28 Transfer to self DEBIT INR 100.00', 'google_pay');
    expect(result.rows).toEqual([]); expect(result.skippedCount).toBe(4);
  });
  it('does not infer debit or credit when direction is ambiguous', () => {
    expect(parsePaymentStatement('Paytm\n2026-09-30 Transaction INR 100.00', 'paytm').rows).toEqual([]);
  });
  it('rejects mismatched providers and unreadable input', () => {
    expect(() => parsePaymentStatement(phonepe, 'google_pay')).toThrow('different payment app');
    expect(() => parsePaymentStatement('', 'phonepe')).toThrow('readable');
  });
  it('uses stable identifiers across overlapping statements and scopes duplicates to the owner', () => {
    const first = parsePaymentStatement(phonepe, 'phonepe').rows[0];
    const next = parsePaymentStatement(phonepe.replace('PhonePe Transaction Statement', 'PhonePe statement export'), 'phonepe').rows[0];
    expect(next.key).toBe(first.key);
    const existing: Transaction = { ...first, id: 'existing', user_id: 'owner', created_at: '2026-09-30' };
    expect(findStatementDuplicate(first, [existing], 'owner')).toBe(true);
    expect(findStatementDuplicate(first, [existing], 'other')).toBe(false);
    expect(findPossibleStatementDuplicate(first, [{ ...existing, sourceFingerprint: 'notification' }], 'owner')).toBe(true);
  });
  it('keeps separate equal-value payments without references selectable', () => {
    const result = parsePaymentStatement('Google Pay\n2026-09-30 Paid to Cafe ₹100\n2026-09-30 Paid to Cafe ₹100', 'google_pay');
    expect(result.rows).toHaveLength(2); expect(result.rows[0].key).not.toBe(result.rows[1].key);
  });
});
