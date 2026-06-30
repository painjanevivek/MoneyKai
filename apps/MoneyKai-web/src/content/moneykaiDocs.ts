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
      'Use the linked cards to move into Transactions, Budgets, Reports, or Goals when a deeper correction is needed.',
    ],
    productionNotes: [
      'Dashboard should remain read-first and low-friction; avoid adding heavy forms directly to this surface.',
      'Every metric should be traceable back to user-owned records or deterministic local state.',
      'Empty local data should explain what is missing instead of showing blank analytical panels.',
    ],
  },
  {
    id: 'transactions',
    title: 'Transactions',
    navLabel: 'Transactions',
    icon: 'swap-horizontal',
    eyebrow: 'Money movement ledger',
    summary:
      'Transactions is the canonical workspace for income and expense records, including manual corrections, filters, categories, and review status.',
    outcomes: [
      'Add, edit, filter, and delete user-owned records without changing unrelated financial state.',
      'Separate income, expense, transfer, and recurring movement for cleaner summaries.',
      'Use reviewed local records as the trusted input for budgets and analytics.',
    ],
    workflow: [
      'Filter by reporting month, account, capture source, payment method, or category.',
      'Open a transaction row when a category, amount, note, or payment method needs correction.',
      'Review manual entries carefully so duplicates do not pollute the ledger.',
    ],
    productionNotes: [
      'Mutations must preserve user ownership and never trust client-provided user IDs for authorization.',
      'Delete and bulk actions need clear confirmation or reversible handling where practical.',
      'Manual records should carry enough context for review and deduplication.',
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
    id: 'reports',
    title: 'Reports',
    navLabel: 'Reports',
    icon: 'chart-bar',
    eyebrow: 'Review and import analysis',
    summary:
      'Reports turns local transaction history into reviewable monthly patterns, category trends, and practical next steps.',
    outcomes: [
      'Understand category distribution, recurring movement, and month-level patterns.',
      'Review local transaction history before relying on category trends.',
      'Launch challenges or follow-up workflows from observed spending signals.',
    ],
    workflow: [
      'Use the report month context to inspect trends and category summaries.',
      'Check source transactions when a category total looks wrong.',
      'Return to Transactions when source rows or categories need correction.',
    ],
    productionNotes: [
      'Reports should stay deterministic from local transaction and budget state.',
      'Any future file import must validate accepted formats, size limits, and parse failures before release.',
      'Reports should expose assumptions in plain language rather than hiding calculation gaps.',
    ],
  },
];

export const MONEYKAI_DOC_OUTLINE = [
  { id: 'quick-start', label: 'Quick start' },
  { id: 'what-you-get', label: "What you'll understand" },
  ...MONEYKAI_DOC_SECTIONS.map((section) => ({ id: section.id, label: section.title })),
] as const;
