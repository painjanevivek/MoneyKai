import { NativeModules } from 'react-native';
import { getCategoryById } from '@/constants/categories';
import type { Transaction } from '@/types/transaction';
import type { ActivityDates } from '@/utils/activityDates';
import { activityDateError, matchesActivityDate } from '@/utils/activityDates';
import { toLocalDateKey } from '@/utils/calendarDates';
import { useAuthStore } from '@/stores/useAuthStore';

export const csvCell = (value: string | number) => {
  const text = String(value);
  const safe = typeof value === 'string' && /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};
export function buildTransactionCsv(transactions: Transaction[], owner: string, dates: ActivityDates, displayName: (transaction: Transaction) => string) {
  if (activityDateError(dates)) throw new Error('Choose a valid date range.');
  const rows = transactions.filter(item => item.user_id === owner && matchesActivityDate(item.transaction_date, dates));
  if (!rows.length) throw new Error('No transactions in this date range.');
  return '\uFEFF' + ['Date,Type,Amount,Category,Name,Original description,Payment method', ...rows.map(item =>
    [item.transaction_date, item.type === 'income' ? 'Credit' : 'Debit', item.type === 'income' ? item.amount : -item.amount,
      getCategoryById(item.category)?.name ?? item.category, displayName(item), item.description, item.payment_method].map(csvCell).join(','))].join('\r\n');
}
export async function downloadTransactionCsv(transactions: Transaction[], owner: string, dates: ActivityDates, displayName: (transaction: Transaction) => string): Promise<boolean> {
  if (!owner || useAuthStore.getState().user?.id !== owner) throw new Error('Your session changed. Reopen Download.');
  const csv = buildTransactionCsv(transactions, owner, dates, displayName);
  const exporter = NativeModules.MoneyKaiTransactionExport as { saveCsv?: (name: string, csv: string) => Promise<boolean> } | undefined;
  if (!exporter?.saveCsv) throw new Error('File download is unavailable on this device.');
  return exporter.saveCsv(`MoneyKai-transactions-${toLocalDateKey(new Date())}.csv`, csv);
}
