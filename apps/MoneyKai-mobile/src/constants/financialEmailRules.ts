import type { FinancialEmailCategory } from '@/types/gmail';

export const FINANCIAL_EMAIL_CATEGORIES: { key: FinancialEmailCategory; label: string; sensitive?: boolean }[] = [
  { key: 'bank_statement', label: 'Bank statements' },
  { key: 'credit_card_statement', label: 'Credit card statements' },
  { key: 'broker_contract_note', label: 'Broker contract notes' },
  { key: 'mutual_fund_statement', label: 'Mutual fund statements' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'loan', label: 'Loans' },
  { key: 'tax', label: 'Tax' },
  { key: 'receipt', label: 'Receipts' },
  { key: 'subscription', label: 'Subscriptions' },
  { key: 'salary', label: 'Salary slips', sensitive: true },
];

export const DEFAULT_GMAIL_ALLOWED_CATEGORIES: FinancialEmailCategory[] = [
  'bank_statement',
  'credit_card_statement',
  'broker_contract_note',
  'mutual_fund_statement',
  'receipt',
  'subscription',
];

export const FINANCIAL_PROVIDER_HINTS = [
  { providerKey: 'hdfc_bank', domains: ['hdfcbank.com'], categories: ['bank_statement', 'credit_card_statement'] },
  { providerKey: 'icici_bank', domains: ['icicibank.com'], categories: ['bank_statement', 'credit_card_statement'] },
  { providerKey: 'sbi_bank', domains: ['sbi.co.in'], categories: ['bank_statement', 'credit_card_statement'] },
  { providerKey: 'zerodha', domains: ['zerodha.com'], categories: ['broker_contract_note'] },
  { providerKey: 'cams', domains: ['camsonline.com'], categories: ['mutual_fund_statement'] },
  { providerKey: 'kfintech', domains: ['kfintech.com'], categories: ['mutual_fund_statement'] },
] as const;

export const GMAIL_RESTRICTED_SCOPE_NOTICE =
  'Gmail sync is disabled until MoneyKai is configured for restricted-scope review and user consent.';

export const PDF_PASSWORD_SAFETY_NOTICE =
  'PDF parsing only uses passwords or patterns approved by the user for their own financial statements.';
