import {
  formatLinkedAccountMask,
  type LinkedAccount,
} from '@moneykai/domain';
import type { Transaction, TransactionCaptureSource, TransactionType } from '@/types/transaction';

type TransactionTemplate = {
  key: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  paymentMethod: string;
  daysAgo: number;
};

const toDateString = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
};

const normalizeKey = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const getCaptureSource = (account: LinkedAccount): TransactionCaptureSource =>
  account.provider === 'manual' ? 'manual' : 'aa';

const getAccountLabel = (account: LinkedAccount) =>
  `${account.institutionName} - ${formatLinkedAccountMask(account)}`;

const makeTransaction = (
  userId: string,
  account: LinkedAccount,
  template: TransactionTemplate,
  nowIso: string
): Transaction => {
  const transactionDate = toDateString(template.daysAgo);
  const canonicalKey = [
    'linked',
    account.id,
    transactionDate,
    template.type,
    template.amount.toFixed(2),
    normalizeKey(template.description),
  ].join(':');

  return {
    id: `linked_txn_${normalizeKey(account.id)}_${normalizeKey(template.key)}_${transactionDate}`,
    user_id: userId,
    type: template.type,
    amount: template.amount,
    category: template.category,
    description: template.description,
    payment_method: template.paymentMethod,
    captureAccountId: account.id,
    captureAccountLabel: getAccountLabel(account),
    captureBankLabel: account.institutionName,
    captureAccountHint: account.maskedAccountNumber,
    captureSource: getCaptureSource(account),
    canonicalTransactionKey: canonicalKey,
    sourceFingerprint: `${account.provider}:${canonicalKey}`,
    transaction_date: transactionDate,
    created_at: nowIso,
  };
};

export const buildLinkedAccountTransactions = (
  userId: string,
  accounts: LinkedAccount[]
): Transaction[] => {
  const nowIso = new Date().toISOString();
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const templates: TransactionTemplate[] = [
    {
      key: 'salary',
      accountId: 'linked_sandbox_hdfc_checking',
      type: 'income',
      amount: 85000,
      category: 'allowance',
      description: 'Salary credit - MoneyKai Labs',
      paymentMethod: 'bank',
      daysAgo: 2,
    },
    {
      key: 'rent',
      accountId: 'linked_sandbox_hdfc_checking',
      type: 'expense',
      amount: 28000,
      category: 'rent',
      description: 'Rent autopay',
      paymentMethod: 'bank',
      daysAgo: 4,
    },
    {
      key: 'groceries',
      accountId: 'linked_sandbox_hdfc_checking',
      type: 'expense',
      amount: 2140,
      category: 'food',
      description: 'Instamart groceries',
      paymentMethod: 'upi',
      daysAgo: 1,
    },
    {
      key: 'metro',
      accountId: 'linked_sandbox_hdfc_checking',
      type: 'expense',
      amount: 340,
      category: 'transport',
      description: 'Metro card recharge',
      paymentMethod: 'upi',
      daysAgo: 3,
    },
    {
      key: 'coffee',
      accountId: 'linked_sandbox_sbi_credit',
      type: 'expense',
      amount: 620,
      category: 'food',
      description: 'Blue Tokai Coffee',
      paymentMethod: 'card',
      daysAgo: 1,
    },
    {
      key: 'electronics',
      accountId: 'linked_sandbox_sbi_credit',
      type: 'expense',
      amount: 4999,
      category: 'shopping',
      description: 'Amazon accessories',
      paymentMethod: 'card',
      daysAgo: 5,
    },
    {
      key: 'sip',
      accountId: 'linked_sandbox_icici_savings',
      type: 'expense',
      amount: 5000,
      category: 'others',
      description: 'Mutual fund SIP',
      paymentMethod: 'bank',
      daysAgo: 6,
    },
    {
      key: 'cashback',
      accountId: 'linked_sandbox_icici_savings',
      type: 'income',
      amount: 450,
      category: 'refund',
      description: 'Card cashback credit',
      paymentMethod: 'bank',
      daysAgo: 7,
    },
  ];

  return templates
    .map((template) => {
      const account = accountsById.get(template.accountId);
      return account ? makeTransaction(userId, account, template, nowIso) : null;
    })
    .filter((transaction): transaction is Transaction => Boolean(transaction));
};
