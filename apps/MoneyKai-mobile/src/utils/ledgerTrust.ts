import type { Group, GroupExpense } from '@/types/group';
import { getExpensePaise, getSplitOutstandingPaise, getSplitPaise } from './groupExpense';

export const getExpenseBalanceContributionPaise = (expense: GroupExpense, currentUserId: string): number => {
  if (expense.sync_status === 'pending' || expense.sync_status === 'failed') return 0;

  return (expense.splits ?? []).reduce((balance, split) => {
    const open = getSplitOutstandingPaise(expense, split);
    if (expense.paid_by === currentUserId) return balance + open;
    if (split.user_id === currentUserId) return balance - open;
    return balance;
  }, 0);
};

export const countUnconfirmedGroupRecords = (group: Group | undefined, expenses: GroupExpense[]) => {
  const statuses = [group?.sync_status, ...expenses.flatMap((expense) => [
    expense.sync_status,
    ...(expense.settlements ?? []).map((settlement) => settlement.sync_status),
  ])];
  return {
    pending: statuses.filter((status) => status === 'pending').length,
    failed: statuses.filter((status) => status === 'failed').length,
  };
};

const csvCell = (value: string, guardFormula = true): string => {
  const cleaned = value.replaceAll('\0', '');
  const safe = guardFormula && /^[\s\uFEFF]*[=+\-@]/.test(cleaned) ? `'${cleaned}` : cleaned;
  return `"${safe.replace(/"/g, '""')}"`;
};

const exactRupees = (paise: number): string => {
  const absolute = Math.abs(paise);
  return `${paise < 0 ? '-' : ''}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, '0')}`;
};

type LedgerCsvRow = {
  type: string;
  id: string;
  parentId?: string;
  date: string;
  description?: string;
  participant?: string;
  payer?: string;
  paise?: number;
  status?: string;
  reversesId?: string;
};

export const buildGroupLedgerCsv = (group: Group, expenses: GroupExpense[]): string => {
  const rows: LedgerCsvRow[] = [{ type: 'group', id: group.id, date: group.created_at, status: group.sync_status ?? 'unknown' }];

  [...expenses].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)).forEach((expense) => {
    rows.push({
      type: 'expense', id: expense.id, date: expense.occurred_on ?? expense.created_at,
      description: expense.description, payer: expense.paid_by_name ?? expense.paid_by,
      paise: getExpensePaise(expense), status: expense.sync_status ?? 'unknown',
    });
    (expense.splits ?? []).forEach((split) => rows.push({
      type: 'share', id: split.id, parentId: expense.id, date: expense.occurred_on ?? expense.created_at,
      description: expense.description, participant: split.user_name ?? split.user_id,
      payer: expense.paid_by_name ?? expense.paid_by, paise: getSplitPaise(split),
      status: expense.sync_status ?? 'unknown',
    }));
    [...(expense.settlements ?? [])].sort((a, b) => a.settled_at.localeCompare(b.settled_at) || a.id.localeCompare(b.id)).forEach((settlement) => rows.push({
      type: settlement.kind === 'reversal' ? 'settlement_reversal' : 'settlement',
      id: settlement.id, parentId: expense.id, date: settlement.settled_at,
      description: expense.description, participant: settlement.from_user_name ?? settlement.from_user,
      payer: settlement.to_user_name ?? settlement.to_user,
      paise: settlement.kind === 'reversal' ? -settlement.amount_paise : settlement.amount_paise,
      status: settlement.sync_status ?? 'unknown', reversesId: settlement.reverses_settlement_id,
    }));
  });

  const header = 'record_type,group_name,record_id,parent_record_id,date,description,participant,payer,amount_paise,amount_rupees,sync_status,reverses_record_id';
  return [header, ...rows.map((row) => [
    row.type, group.name, row.id, row.parentId ?? '', row.date, row.description ?? '',
    row.participant ?? '', row.payer ?? '', row.paise === undefined ? '' : String(row.paise),
    row.paise === undefined ? '' : exactRupees(row.paise), row.status ?? 'unknown', row.reversesId ?? '',
  ].map((value, index) => csvCell(value, index !== 8 && index !== 9)).join(','))].join('\r\n');
};
