import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Transaction } from '@/types/transaction';
const mock = vi.hoisted(() => ({ save: vi.fn(async () => true), owner: 'owner' }));
vi.mock('react-native', () => ({ NativeModules: { MoneyKaiTransactionExport: { saveCsv: mock.save } } }));
vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: { getState: () => ({ user: { id: mock.owner } }) } }));
import { buildTransactionCsv, csvCell, downloadTransactionCsv } from './transactionExport';
const transaction: Transaction = { id: 'one', user_id: 'owner', type: 'expense', amount: 150, category: 'others', description: 'Name, "quote"\nnext line', payment_method: 'upi', transaction_date: '2026-09-30', created_at: '2026-09-30T10:00:00Z', captureSource: 'sms' };
const dates = { id: 'custom' as const, start: '2026-09-30', end: '2026-09-30' };
describe('explicit CSV download', () => {
  beforeEach(() => { vi.clearAllMocks(); mock.owner = 'owner'; mock.save.mockResolvedValue(true); });
  it('exports only the chosen owner/date with nickname and intact original description', () => {
    const csv = buildTransactionCsv([transaction, { ...transaction, user_id: 'other' }, { ...transaction, transaction_date: '2026-09-29' }], 'owner', dates, () => 'Familiar name');
    expect(csv).toContain('"Debit","-150"');
    expect(csv).toContain('"Familiar name","Name, ""quote""\nnext line"');
    expect(csv.match(/"Debit"/g)).toHaveLength(1);
    expect(transaction.description).toBe('Name, "quote"\nnext line');
    expect(csvCell(' =HYPERLINK("bad")')).toMatch(/^"'/);
    expect(csvCell('+formula')).toBe('"\'+formula"');
  });
  it('does not use a share menu, upload endpoint or native save until explicitly called', async () => {
    expect(mock.save).not.toHaveBeenCalled();
    expect(await downloadTransactionCsv([transaction], 'owner', dates, item => item.description)).toBe(true);
    expect(mock.save).toHaveBeenCalledWith(expect.stringMatching(/^MoneyKai-transactions-\d{4}-\d{2}-\d{2}\.csv$/), expect.stringContaining('Original description'));
  });
  it('respects cancellation and rejects owner switches, invalid dates and empty ranges', async () => {
    mock.save.mockResolvedValue(false);
    expect(await downloadTransactionCsv([transaction], 'owner', dates, item => item.description)).toBe(false);
    mock.owner = 'other';
    await expect(downloadTransactionCsv([transaction], 'owner', dates, item => item.description)).rejects.toThrow('session changed');
    expect(() => buildTransactionCsv([transaction], 'owner', { ...dates, start: '2026-10-01' }, item => item.description)).toThrow('valid date range');
    expect(() => buildTransactionCsv([], 'owner', dates, item => item.description)).toThrow('No transactions');
  });
});
