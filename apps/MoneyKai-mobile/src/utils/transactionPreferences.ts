import type { Transaction } from '@/types/transaction';

// Exact normalized text only: never assume two truncated/prefix names identify
// the same person. Original ledger/source descriptions remain untouched.
export const counterpartyAliasKey = (transaction: Pick<Transaction, 'counterpartyName' | 'description'>) =>
  (transaction.counterpartyName?.trim() || transaction.description.trim()).normalize('NFKC').toLocaleLowerCase('en-IN').replace(/\s+/g, ' ');

export const phoneDigits = (value: string) => value.replace(/[^0-9]/g, '');
export function normalizedPhone(code: string, number: string) {
  const country = code.replace(/^\+/, '');
  const national = phoneDigits(number);
  if (!/^[1-9]\d{0,2}$/.test(country) || !/^[1-9]\d{5,13}$/.test(national) || country.length + national.length > 15) return undefined;
  if (country === '91' && !/^[6-9]\d{9}$/.test(national)) return undefined;
  return `+${country}${national}`;
}
export type LocalPhone = { countryCode: string; nationalNumber: string };
export const validLocalPhone = (phone?: LocalPhone) => Boolean(phone && normalizedPhone(phone.countryCode, phone.nationalNumber));
