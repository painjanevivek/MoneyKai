import type { Transaction } from '../types/transaction';

/** Preview sample rows belong to the demo ledger, never a production account. */
export const purchaseExpenseAmounts = (
  transactions: ReadonlyArray<Pick<Transaction, 'user_id' | 'type' | 'transaction_date' | 'amount'>>,
  ownerId: string | undefined,
  month: string,
  includePreviewSamples = false,
) => {
  if (!ownerId) return [];
  return transactions.filter((transaction) =>
    (transaction.user_id === ownerId || (includePreviewSamples && transaction.user_id === 'sample'))
    && transaction.type === 'expense'
    && transaction.transaction_date.startsWith(`${month}-`),
  ).map((transaction) => transaction.amount);
};

export const parseMoneyPaise = (text: string): number | null => {
  const value = text.trim().replace(/,/g, '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, decimal = ''] = value.split('.');
  const paise = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  return Number.isSafeInteger(paise) && paise <= 100_000_000_000 ? paise : null;
};

export const formatToolMoney = (paise: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 2,
}).format(paise / 100);

export function estimatePurchase(remainingPaise: number, pricePaise: number, commitmentsPaise: number, days: number) {
  if (![remainingPaise, pricePaise, commitmentsPaise, days].every(Number.isSafeInteger)
    || pricePaise < 0 || commitmentsPaise < 0 || days < 1) return null;
  const beforePaise = remainingPaise - commitmentsPaise;
  const afterPaise = beforePaise - pricePaise;
  if (![beforePaise, afterPaise].every(Number.isSafeInteger)) return null;
  return {
    beforePaise, afterPaise,
    dailyBeforePaise: Math.floor(Math.max(0, beforePaise) / days),
    dailyAfterPaise: Math.floor(Math.max(0, afterPaise) / days),
    shortfallPaise: Math.max(0, -afterPaise),
  };
}

export const PRICE_UNITS = {
  each: { label: 'each', family: 'count', factor: 1, baseLabel: 'item' },
  g: { label: 'g', family: 'weight', factor: 0.001, baseLabel: 'kg' },
  kg: { label: 'kg', family: 'weight', factor: 1, baseLabel: 'kg' },
  ml: { label: 'ml', family: 'volume', factor: 0.001, baseLabel: 'L' },
  L: { label: 'L', family: 'volume', factor: 1, baseLabel: 'L' },
} as const;
export type PriceUnit = keyof typeof PRICE_UNITS;

export const pricePerBaseUnit = (pricePaise: number, quantity: number, unit: PriceUnit): number | null => {
  if (!Number.isSafeInteger(pricePaise) || pricePaise <= 0 || !Number.isFinite(quantity) || quantity <= 0) return null;
  const result = pricePaise / (quantity * PRICE_UNITS[unit].factor);
  return Number.isFinite(result) ? result : null;
};

export const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const priceIdentity = (name: string, variant: string) => `${name.trim().toLocaleLowerCase('en-IN')}|${variant.trim().toLocaleLowerCase('en-IN')}`;
