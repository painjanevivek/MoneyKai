import type { ExpenseSplit, Group, GroupExpense, GroupMember, Settlement } from '@/types/group';

export type LedgerState = 'EMPTY' | 'OPEN' | 'SETTLED';

export interface ParticipantBalance {
  userId: string;
  userName: string;
  balancePaise: number;
}

export interface GroupLedgerSummary {
  state: LedgerState;
  currentUserBalancePaise: number;
  totalExpensePaise: number;
  outstandingPaise: number;
  participantBalances: ParticipantBalance[];
}

export interface SharedPosition {
  owedPaise: number;
  owePaise: number;
  openShares: number;
}

/** Keep the two directions separate: a net figure can conceal money still due. */
export const deriveSharedPosition = (expenses: GroupExpense[], currentUserId: string): SharedPosition => {
  const position = { owedPaise: 0, owePaise: 0, openShares: 0 };
  for (const expense of expenses) {
    if (expense.sync_status === 'pending' || expense.sync_status === 'failed') continue;
    for (const split of expense.splits ?? []) {
      const open = getSplitOutstandingPaise(expense, split);
      if (open <= 0) continue;
      if (expense.paid_by === currentUserId) position.owedPaise += open;
      if (split.user_id === currentUserId) position.owePaise += open;
      if (expense.paid_by === currentUserId || split.user_id === currentUserId) position.openShares += 1;
    }
  }
  return position;
};

export type ParseMoneyResult =
  | { ok: true; paise: number }
  | { ok: false; error: string };

const MAX_PAISE = 100_000_000_000_000;
const MAX_SAFE_RUPEES = Math.floor(MAX_PAISE / 100);

export const createClientMutationId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const parseRupeesToPaise = (value: string): ParseMoneyResult => {
  const normalized = value.replace(/,/g, '').trim();
  if (!normalized) return { ok: false, error: 'Enter an amount greater than zero.' };
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return { ok: false, error: 'Use a valid amount with no more than two decimal places.' };
  }

  const [rupeesText, paiseText = ''] = normalized.split('.');
  const rupees = Number(rupeesText);
  if (!Number.isSafeInteger(rupees) || rupees > MAX_SAFE_RUPEES) {
    return { ok: false, error: 'This amount is too large to record safely.' };
  }
  const paise = rupees * 100 + Number(paiseText.padEnd(2, '0'));
  if (paise <= 0) return { ok: false, error: 'Enter an amount greater than zero.' };
  if (paise > MAX_PAISE) return { ok: false, error: 'This amount is too large to record safely.' };
  return { ok: true, paise };
};

export const formatPaise = (paise: number, currencySymbol = '₹'): string =>
  `${currencySymbol}${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

export const splitPaiseExactly = (totalPaise: number, members: GroupMember[]): ExpenseSplit[] => {
  if (!Number.isSafeInteger(totalPaise) || totalPaise <= 0 || totalPaise > MAX_PAISE || members.length === 0) return [];

  const basePaise = Math.floor(totalPaise / members.length);
  const remainder = totalPaise % members.length;
  return members.map((member, index) => {
    const paise = basePaise + (index < remainder ? 1 : 0);
    return {
      id: '',
      group_expense_id: '',
      user_id: member.user_id,
      user_name: member.user_name || `Person ${index + 1}`,
      amount: paise / 100,
      amount_paise: paise,
      is_settled: false,
    };
  });
};

/** Allocates an amount in integer paise so the displayed shares always add back to the total. */
export const splitGroupAmountExactly = (amount: number, members: GroupMember[]): ExpenseSplit[] => {
  const parsed = parseRupeesToPaise(String(amount));
  return parsed.ok ? splitPaiseExactly(parsed.paise, members) : [];
};

const legacyAmountToPaise = (amount: number): number => {
  if (amount === 0) return 0;
  const parsed = parseRupeesToPaise(String(amount));
  if (!parsed.ok) throw new Error('A legacy ledger amount has unsupported precision.');
  return parsed.paise;
};

export const getExpensePaise = (expense: GroupExpense): number =>
  expense.amount_paise ?? legacyAmountToPaise(expense.amount);

export const getSplitPaise = (split: ExpenseSplit): number =>
  split.amount_paise ?? legacyAmountToPaise(split.amount);

const settlementDirection = (settlement: Settlement): number => settlement.kind === 'reversal' ? -1 : 1;

export const getSplitSettledPaise = (expense: GroupExpense, splitId: string): number =>
  (expense.settlements ?? [])
    .filter((settlement) => settlement.split_id === splitId && settlement.sync_status !== 'pending' && settlement.sync_status !== 'failed')
    .reduce((sum, settlement) => sum + settlementDirection(settlement) * settlement.amount_paise, 0);

export const getSplitOutstandingPaise = (expense: GroupExpense, split: ExpenseSplit): number => {
  if (split.user_id === expense.paid_by) return 0;
  return Math.max(0, getSplitPaise(split) - getSplitSettledPaise(expense, split.id));
};

export const appendExpenseIdempotently = (
  expenses: GroupExpense[],
  expense: GroupExpense,
): { expenses: GroupExpense[]; replayed: boolean } => {
  const mutationId = expense.mutation_id;
  const existing = mutationId
    ? expenses.find((item) => item.mutation_id === mutationId)
    : expenses.find((item) => item.id === expense.id);
  if (existing) return { expenses, replayed: true };
  return { expenses: [expense, ...expenses], replayed: false };
};

export const reconcileGroupSnapshot = (
  remoteGroups: Group[], remoteExpenses: GroupExpense[],
  localGroups: Group[], localExpenses: GroupExpense[],
  userId: string, source: 'cache' | 'network',
): { groups: Group[]; expenses: GroupExpense[] } => {
  const ownedLocalGroups = localGroups.filter((group) => group.created_by === userId);
  const localIds = new Set(ownedLocalGroups.map((group) => group.id));
  const ownedLocalExpenses = localExpenses.filter((expense) => localIds.has(expense.group_id));
  const ownedRemoteGroups = remoteGroups.filter((group) => group.created_by === userId);
  const remoteIds = new Set(ownedRemoteGroups.map((group) => group.id));
  const localGroupById = new Map(ownedLocalGroups.map((group) => [group.id, group]));
  const groups = [
    ...ownedRemoteGroups.map((group) => {
      const local = localGroupById.get(group.id);
      const desiredArchived = local?.pending_action === 'archive' ? true : local?.pending_action === 'restore' ? false : undefined;
      if (local && desiredArchived !== undefined && local.sync_status !== 'confirmed' && group.archived !== desiredArchived) return local;
      return { ...group, sync_status: 'confirmed' as const, pending_action: undefined };
    }),
    ...ownedLocalGroups.filter((group) => (source === 'cache' || group.sync_status !== 'confirmed') && !remoteIds.has(group.id)),
  ];
  const allowedGroupIds = new Set(groups.map((group) => group.id));
  const localExpenseById = new Map(ownedLocalExpenses.map((expense) => [expense.id, expense]));
  const remoteExpenseIds = new Set(remoteExpenses.map((expense) => expense.id));
  const expenses = [
    ...remoteExpenses.filter((expense) => allowedGroupIds.has(expense.group_id)).map((expense) => {
      const local = localExpenseById.get(expense.id);
      const remoteMutationIds = new Set((expense.settlements ?? []).map((event) => event.mutation_id));
      const pendingEvents = (local?.settlements ?? []).filter((event) => event.sync_status !== 'confirmed' && !remoteMutationIds.has(event.mutation_id));
      return { ...expense, sync_status: 'confirmed' as const, settlements: [...(expense.settlements ?? []).map((event) => ({ ...event, sync_status: 'confirmed' as const })), ...pendingEvents] };
    }),
    ...ownedLocalExpenses.filter((expense) => allowedGroupIds.has(expense.group_id) && !remoteExpenseIds.has(expense.id) && (source === 'cache' || expense.sync_status !== 'confirmed' || (expense.settlements ?? []).some((event) => event.sync_status !== 'confirmed'))),
  ];
  return { groups, expenses };
};

export interface RecordSettlementInput {
  splitId: string;
  amountPaise: number;
  mutationId: string;
  settledAt?: string;
}

export const recordSettlementEvent = (
  expense: GroupExpense,
  input: RecordSettlementInput,
): { expense: GroupExpense; settlement: Settlement; replayed: boolean } => {
  const existing = (expense.settlements ?? []).find((item) => item.mutation_id === input.mutationId);
  if (existing) return { expense, settlement: existing, replayed: true };

  const split = expense.splits?.find((item) => item.id === input.splitId);
  if (!split || split.user_id === expense.paid_by) throw new Error('This balance is no longer available to settle.');
  if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise <= 0) {
    throw new Error('Settlement amount must be greater than zero.');
  }
  const outstandingPaise = getSplitOutstandingPaise(expense, split);
  if (outstandingPaise === 0) throw new Error(`${split.user_name || 'This participant'} is already settled.`);
  if (input.amountPaise > outstandingPaise) {
    throw new Error(`Settlement cannot exceed the outstanding ${formatPaise(outstandingPaise)}.`);
  }

  const settlement: Settlement = {
    id: `st_${input.mutationId}`,
    mutation_id: input.mutationId,
    expense_id: expense.id,
    split_id: split.id,
    from_user: split.user_id,
    from_user_name: split.user_name,
    to_user: expense.paid_by,
    to_user_name: expense.paid_by_name,
    amount: input.amountPaise / 100,
    amount_paise: input.amountPaise,
    settled_at: input.settledAt ?? new Date().toISOString(),
    group_id: expense.group_id,
    kind: 'recorded',
    sync_status: 'confirmed',
  };
  const settlements = [...(expense.settlements ?? []), settlement];
  const remainingPaise = Math.max(0, outstandingPaise - input.amountPaise);
  const updated: GroupExpense = {
    ...expense,
    settlements,
    splits: expense.splits?.map((item) => item.id === split.id
      ? { ...item, is_settled: remainingPaise === 0, settled_at: remainingPaise === 0 ? settlement.settled_at : undefined }
      : item),
  };
  return { expense: updated, settlement, replayed: false };
};

export const reverseSettlementEvent = (
  expense: GroupExpense,
  settlementId: string,
  mutationId: string,
  reversedAt = new Date().toISOString(),
): GroupExpense => {
  if ((expense.settlements ?? []).some((item) => item.mutation_id === mutationId)) return expense;
  const original = (expense.settlements ?? []).find((item) => item.id === settlementId && item.kind === 'recorded');
  if (!original) throw new Error('The settlement to reverse was not found.');
  if ((expense.settlements ?? []).some((item) => item.reverses_settlement_id === settlementId)) {
    throw new Error('This settlement was already reversed.');
  }
  const reversal: Settlement = {
    ...original,
    id: `st_${mutationId}`,
    mutation_id: mutationId,
    settled_at: reversedAt,
    kind: 'reversal',
    reverses_settlement_id: settlementId,
  };
  return { ...expense, settlements: [...(expense.settlements ?? []), reversal] };
};

export const deriveGroupLedger = (expenses: GroupExpense[], currentUserId: string): GroupLedgerSummary => {
  const balances = new Map<string, ParticipantBalance>();
  let totalExpensePaise = 0;
  let outstandingPaise = 0;

  const confirmedExpenses = expenses.filter((expense) => expense.sync_status !== 'pending' && expense.sync_status !== 'failed');
  for (const expense of confirmedExpenses) {
    totalExpensePaise += getExpensePaise(expense);
    const payerName = expense.paid_by_name || 'Payer';
    if (!balances.has(expense.paid_by)) {
      balances.set(expense.paid_by, { userId: expense.paid_by, userName: payerName, balancePaise: 0 });
    }
    for (const split of expense.splits ?? []) {
      const name = split.user_name || 'Participant';
      if (!balances.has(split.user_id)) {
        balances.set(split.user_id, { userId: split.user_id, userName: name, balancePaise: 0 });
      }
      const open = getSplitOutstandingPaise(expense, split);
      if (open <= 0) continue;
      outstandingPaise += open;
      balances.get(expense.paid_by)!.balancePaise += open;
      balances.get(split.user_id)!.balancePaise -= open;
    }
  }

  return {
    state: confirmedExpenses.length === 0 ? 'EMPTY' : outstandingPaise > 0 ? 'OPEN' : 'SETTLED',
    currentUserBalancePaise: balances.get(currentUserId)?.balancePaise ?? 0,
    totalExpensePaise,
    outstandingPaise,
    participantBalances: [...balances.values()],
  };
};

export const describeBalance = (
  debtorName: string,
  creditorName: string,
  amountPaise: number,
  currentUserId: string,
  debtorId: string,
  creditorId: string,
  currencySymbol = '₹',
): string => {
  const debtor = debtorId === currentUserId ? 'You' : debtorName;
  const creditor = creditorId === currentUserId ? 'you' : creditorName;
  return `${debtor} ${debtorId === currentUserId ? 'owe' : 'owes'} ${creditor} ${formatPaise(amountPaise, currencySymbol)}`;
};
