import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type MoneyKaiDocSection = {
  id: string;
  title: string;
  navLabel: string;
  icon: IconName;
  eyebrow: string;
  summary: string;
  outcomes: string[];
  workflow: string[];
  productionNotes: string[];
};

export const MONEYKAI_DOC_SECTIONS: MoneyKaiDocSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    navLabel: 'Dashboard',
    icon: 'view-dashboard-outline',
    eyebrow: 'Workspace overview',
    summary:
      'Use Dashboard as the first read of monthly financial state: balances, budget pressure, recent movement, emergency posture, and the next useful action.',
    outcomes: [
      'Understand month-to-date income, expense, savings, and budget movement from one screen.',
      'Identify categories and recent transactions that need review before totals are trusted.',
      'Move quickly into related workspaces without losing the current reporting month context.',
    ],
    workflow: [
      'Open Dashboard after sign-in and confirm the reporting month in the workspace header.',
      'Review the top summary cards first, then inspect recent transactions and category signals.',
      'Use the linked cards to move into Transactions, Budgets, Reports, Goals, Accounts, or Portfolio when a deeper correction is needed.',
    ],
    productionNotes: [
      'Dashboard should remain read-first and low-friction; avoid adding heavy forms directly to this surface.',
      'Every metric should be traceable back to user-owned records or deterministic local state.',
      'Empty or unsynced data should explain what is missing instead of showing blank analytical panels.',
    ],
  },
  {
    id: 'transactions',
    title: 'Transactions',
    navLabel: 'Transactions',
    icon: 'swap-horizontal',
    eyebrow: 'Money movement ledger',
    summary:
      'Transactions is the canonical workspace for income and expense records, including imports, manual corrections, filters, categories, and review status.',
    outcomes: [
      'Add, edit, filter, and delete user-owned records without changing unrelated financial state.',
      'Separate income, expense, transfer, recurring, and portfolio-related movement for cleaner reports.',
      'Use reviewed records as the trusted input for budgets, analytics, and AI summaries.',
    ],
    workflow: [
      'Filter by reporting month, account, capture source, payment method, or category.',
      'Open a transaction row when a category, amount, note, or payment method needs correction.',
      'Prefer review-before-import workflows for statement or AI-derived entries so duplicates do not pollute the ledger.',
    ],
    productionNotes: [
      'Mutations must preserve user ownership and never trust client-provided user IDs for authorization.',
      'Delete and bulk actions need clear confirmation or reversible handling where practical.',
      'Imported records should carry source metadata so audit and deduplication remain possible.',
    ],
  },
  {
    id: 'ai-review',
    title: 'AI Review',
    navLabel: 'AI Review',
    icon: 'receipt-text-outline',
    eyebrow: 'Human-reviewed AI assistance',
    summary:
      'AI Review turns receipts, statement text, and images into draft insights or draft records that users inspect before they affect the workspace.',
    outcomes: [
      'Analyze attachments without silently writing AI output into financial records.',
      'Keep user trust by showing model output as reviewable assistance, not final accounting truth.',
      'Route approved drafts into Transactions or Reports with clear source attribution.',
    ],
    workflow: [
      'Upload or choose an attachment, then select the review task that matches the document.',
      'Inspect extracted fields, notes, and confidence signals before using any result.',
      'Approve, edit, or discard drafts instead of treating generated output as automatically correct.',
    ],
    productionNotes: [
      'AI output must be escaped as text and never rendered as trusted HTML.',
      'Provider errors should fall back to local guidance without exposing stack traces or model internals.',
      'Sensitive uploads should be capability-gated and documented before production rollout.',
    ],
  },
  {
    id: 'budgets',
    title: 'Budgets',
    navLabel: 'Budgets',
    icon: 'wallet-outline',
    eyebrow: 'Monthly spending control',
    summary:
      'Budgets provides the monthly guardrails for categories, daily pace, remaining room, and budget health signals.',
    outcomes: [
      'Set category limits that map to real spending behavior.',
      'Understand whether current pace is safe, tight, or critical for the month.',
      'Use budget coaching to decide what to adjust before the month closes.',
    ],
    workflow: [
      'Confirm the reporting month and review overall budget health.',
      'Inspect category tiles for overspend, unused room, and pacing risk.',
      'Adjust limits or return to Transactions when the underlying categorization is wrong.',
    ],
    productionNotes: [
      'Budget calculations should be deterministic and reproducible from transaction state.',
      'Coaching copy should avoid financial-advice claims and focus on operational next steps.',
      'Limit changes should persist per user and not leak into shared or sample records.',
    ],
  },
  {
    id: 'goals',
    title: 'Goals',
    navLabel: 'Goals',
    icon: 'target',
    eyebrow: 'Savings and habit progress',
    summary:
      'Goals exposes active and completed challenge progress as practical financial habit tracking without duplicating another goal engine.',
    outcomes: [
      'Track active goal count, completed goals, deactivated goals, and earned XP.',
      'See progress against challenge duration and current streak.',
      'Use completed history to understand which financial habits are actually sticking.',
    ],
    workflow: [
      'Start from Reports when a real challenge or savings habit is ready to track.',
      'Review active progress and streak state from Goals.',
      'Move completed items out of the active workflow while preserving their history.',
    ],
    productionNotes: [
      'Goal state should not be duplicated across unrelated stores.',
      'Progress labels must handle zero and missing durations safely.',
      'Deactivated goals should remain visible enough for audit without competing with active work.',
    ],
  },
  {
    id: 'wealth',
    title: 'Wealth',
    navLabel: 'Wealth',
    icon: 'chart-timeline-variant',
    eyebrow: 'Net worth and allocation review',
    summary:
      'Wealth summarizes portfolio value, allocation, holdings, and AI-assisted portfolio review when the wealth feature flag is enabled.',
    outcomes: [
      'Review net worth, allocation, and top holdings from a consolidated view.',
      'Refresh or snapshot wealth state without navigating through raw provider details.',
      'Generate AI-assisted portfolio insights only when provider capability is available.',
    ],
    workflow: [
      'Confirm the latest update timestamp before relying on values.',
      'Use Refresh or Snapshot to update local portfolio state.',
      'Open Portfolio when holdings, accounts, or provider metadata need direct maintenance.',
    ],
    productionNotes: [
      'Wealth routes must remain feature-gated so disabled builds redirect safely.',
      'Provider failures should degrade to local/manual portfolio workflows.',
      'Insight copy must avoid regulated financial advice and stay framed as review support.',
    ],
  },
  {
    id: 'portfolio',
    title: 'Portfolio',
    navLabel: 'Portfolio',
    icon: 'briefcase-outline',
    eyebrow: 'Holdings and provider workspace',
    summary:
      'Portfolio is the operating surface for manual holdings, provider placeholders, account metadata, and connection state.',
    outcomes: [
      'Add and maintain holdings with asset type, quantity, price, and source metadata.',
      'Inspect connected accounts and provider status before trusting allocation data.',
      'Use snapshots to create stable review points for Wealth.',
    ],
    workflow: [
      'Review the portfolio summary first, then inspect accounts and holdings.',
      'Add manual entries when provider sync is unavailable or not configured.',
      'Use Wealth for summarized review after raw portfolio data is corrected.',
    ],
    productionNotes: [
      'Provider credentials and secrets must never be exposed to client code.',
      'Manual holdings need validation for numeric fields and safe defaults.',
      'Account disconnect and pause states should preserve enough metadata for audit.',
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    navLabel: 'Reports',
    icon: 'chart-bar',
    eyebrow: 'Review and import analysis',
    summary:
      'Reports turns transaction history and statement imports into reviewable monthly patterns, category trends, and practical next steps.',
    outcomes: [
      'Understand category distribution, recurring movement, and month-level patterns.',
      'Import statement-derived draft rows only after review.',
      'Launch challenges or follow-up workflows from observed spending signals.',
    ],
    workflow: [
      'Use the report month context to inspect trends and category summaries.',
      'Upload or paste statement data, then review parsed drafts before importing.',
      'Return to Transactions when source rows or categories need correction.',
    ],
    productionNotes: [
      'File import must validate accepted formats, size limits, and parse failures.',
      'Parsed rows should be treated as untrusted until explicitly approved by the user.',
      'Reports should expose assumptions in plain language rather than hiding calculation gaps.',
    ],
  },
  {
    id: 'accounts',
    title: 'Accounts',
    navLabel: 'Accounts',
    icon: 'credit-card-outline',
    eyebrow: 'Linked balances and sync health',
    summary:
      'Accounts shows linked account status, sync health, balances, and controls for sandbox or provider-backed account records.',
    outcomes: [
      'See connected, syncing, attention, and total account counts in one place.',
      'Inspect individual account status before relying on balances.',
      'Refresh or reconnect accounts when sync health requires action.',
    ],
    workflow: [
      'Start with the linked accounts summary and attention indicators.',
      'Open an account row to review balance, status, and provider metadata.',
      'Use Sync All or reconnect actions only when the provider path is configured and available.',
    ],
    productionNotes: [
      'Account data requires strict user-level authorization on every load and mutation.',
      'Provider tokens, secrets, and internal connection details must never be displayed.',
      'Demo or sandbox accounts should be clearly separated from real user account data.',
    ],
  },
];

export const MONEYKAI_DOC_OUTLINE = [
  { id: 'quick-start', label: 'Quick start' },
  { id: 'what-you-get', label: "What you'll understand" },
  ...MONEYKAI_DOC_SECTIONS.map((section) => ({ id: section.id, label: section.title })),
] as const;
