import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Share, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon as MaterialCommunityIcons } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { BorderRadius, Spacing, TransactionDirectionColorOnDark, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSyncStore } from '@/stores/useSyncStore';
import type { ExpenseSplit, Group, GroupExpense, Settlement } from '@/types/group';
import {
  createClientMutationId,
  deriveGroupLedger,
  deriveSharedPosition,
  describeBalance,
  formatPaise,
  getExpensePaise,
  getSplitPaise,
  getSplitOutstandingPaise,
  getSplitSettledPaise,
} from '@/utils/groupExpense';
import { buildGroupLedgerCsv, countUnconfirmedGroupRecords, getExpenseBalanceContributionPaise } from '@/utils/ledgerTrust';

interface SharedGroupLedgerSheetProps {
  visible: boolean;
  group?: Group;
  expenses: GroupExpense[];
  currentUser: { id: string; name: string };
  currencySymbol: string;
  onClose: () => void;
  onAddExpense: () => void;
  onRecordSettlement: (expenseId: string, splitId: string, amountPaise: number, mutationId: string) => Promise<Settlement>;
  onReverseSettlement: (expenseId: string, settlementId: string, mutationId: string) => Promise<void>;
  onRetryExpense: (expenseId: string) => Promise<void>;
  onArchive: () => void;
}

type SelectedBalance = { expense: GroupExpense; split: ExpenseSplit; amountPaise: number };
type LedgerHistoryEntry =
  | { kind: 'expense'; id: string; at: string; expense: GroupExpense }
  | { kind: 'settlement'; id: string; at: string; expense: GroupExpense; settlement: Settlement };

export function SharedGroupLedgerSheet(props: SharedGroupLedgerSheetProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<SelectedBalance>();
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [retryingId, setRetryingId] = useState<string>();
  const [expandedExpenseId, setExpandedExpenseId] = useState<string>();
  const [balanceExplanationOpen, setBalanceExplanationOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [mutationId, setMutationId] = useState(() => createClientMutationId('settlement'));
  const summary = useMemo(() => deriveGroupLedger(props.expenses, props.currentUser.id), [props.currentUser.id, props.expenses]);
  const position = useMemo(() => deriveSharedPosition(props.expenses, props.currentUser.id), [props.currentUser.id, props.expenses]);
  const isOnline = useSyncStore((state) => state.isOnline);
  const confirmationCounts = useMemo(() => countUnconfirmedGroupRecords(props.group, props.expenses), [props.group, props.expenses]);
  const confirmedExpenses = useMemo(() => props.expenses.filter((expense) => expense.sync_status !== 'pending' && expense.sync_status !== 'failed'), [props.expenses]);
  const history = useMemo<LedgerHistoryEntry[]>(() => props.expenses.flatMap((expense): LedgerHistoryEntry[] => [
    { kind: 'expense', id: `expense-${expense.id}`, at: expense.occurred_on || expense.created_at, expense },
    ...(expense.settlements ?? []).map((settlement): LedgerHistoryEntry => ({ kind: 'settlement', id: `settlement-${settlement.id}`, at: settlement.settled_at, expense, settlement })),
  ]).sort((a, b) => b.at.localeCompare(a.at)), [props.expenses]);

  useEffect(() => {
    if (!props.visible) {
      setSelected(undefined);
      setConfirmed(false);
      setError(undefined);
      setExpandedExpenseId(undefined);
      setBalanceExplanationOpen(false);
    }
  }, [props.visible]);

  const openSettlement = (expense: GroupExpense, split: ExpenseSplit) => {
    if (expense.sync_status !== 'confirmed' || (expense.settlements ?? []).some((event) => event.split_id === split.id && event.sync_status !== 'confirmed')) return;
    const amountPaise = getSplitOutstandingPaise(expense, split);
    if (amountPaise <= 0) return;
    setSelected({ expense, split, amountPaise });
    setConfirmed(false);
    setError(undefined);
    setMutationId(createClientMutationId('settlement'));
  };

  const retrySettlement = async (expense: GroupExpense, settlement: Settlement) => {
    if (retryingId) return;
    setRetryingId(settlement.mutation_id);
    setError(undefined);
    try {
      await props.onRecordSettlement(expense.id, settlement.split_id, settlement.amount_paise, settlement.mutation_id);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Confirmation is still unknown. Retry this same record.');
    } finally {
      setRetryingId(undefined);
    }
  };

  const retryReversal = async (expense: GroupExpense, settlement: Settlement) => {
    if (!settlement.reverses_settlement_id || retryingId) return;
    setRetryingId(settlement.mutation_id);
    setError(undefined);
    try {
      await props.onReverseSettlement(expense.id, settlement.reverses_settlement_id, settlement.mutation_id);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Correction confirmation is still unknown.');
    } finally {
      setRetryingId(undefined);
    }
  };

  const retryExpense = async (expenseId: string) => {
    setError(undefined);
    try {
      await props.onRetryExpense(expenseId);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Expense confirmation is still unknown.');
    }
  };

  const recordSettlement = async () => {
    if (!selected || !confirmed || submitting) return;
    setSubmitting(true);
    setError(undefined);
    try {
      await props.onRecordSettlement(selected.expense.id, selected.split.id, selected.amountPaise, mutationId);
      setSelected(undefined);
      setConfirmed(false);
    } catch (settlementError) {
      setError(settlementError instanceof Error ? settlementError.message : 'The settlement was retained. Retry safely.');
    } finally {
      setSubmitting(false);
    }
  };

  const shareLedger = () => {
    const group = props.group;
    if (!group) return;
    Alert.alert(
      'Share ledger data?',
      'This CSV text includes names, exact amounts, and all recorded corrections. Unconfirmed records are labeled. Share it only with people you trust.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share CSV text',
          onPress: () => {
            void Share.share({
              title: `${group.name} ledger`,
              message: buildGroupLedgerCsv(group, props.expenses),
            }).catch(() => Alert.alert('Share unavailable', 'This device could not open the share sheet. Please try again.'));
          },
        },
      ],
    );
  };

  if (selected) {
    const participant = selected.split.user_name || 'Participant';
    const payerName = selected.expense.paid_by_name || 'the payer';
    const balanceIntro = selected.split.user_id === props.currentUser.id
      ? `You owe ${payerName}`
      : `${participant} owes ${selected.expense.paid_by === props.currentUser.id ? 'you' : payerName}`;
    return (
      <ModalSheet
        visible={props.visible}
        title="Record settlement"
        subtitle={`${props.group?.name ?? 'Group'} · ${participant}`}
        onClose={() => { if (!submitting) setSelected(undefined); }}
        footer={(
          <View style={{ gap: Spacing.sm }}>
            {error ? <Text accessibilityRole="alert" style={{ color: colors.error, fontSize: Typography.fontSize.xs }}>{error}</Text> : null}
            <Button
              title={`${error ? 'Retry recording' : 'Record'} ${formatPaise(selected.amountPaise, props.currencySymbol)} settlement`}
              onPress={recordSettlement}
              disabled={!confirmed}
              loading={submitting}
              accessibilityLabel={confirmed ? `Record ${formatPaise(selected.amountPaise, props.currencySymbol)} settlement` : 'Record settlement, disabled until payment confirmation is checked'}
              fullWidth
            />
            <Button title="Back to ledger" variant="ghost" onPress={() => setSelected(undefined)} disabled={submitting} fullWidth />
          </View>
        )}
      >
        <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
          <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm }}>{balanceIntro}</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: 36, marginTop: Spacing.sm }}>{formatPaise(selected.amountPaise, props.currencySymbol)}</Text>
        </View>
        <View style={{ backgroundColor: colors.primaryBg, borderRadius: BorderRadius.md, padding: Spacing.md }}>
          <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>MoneyKai records this settlement.</Text>
          <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, lineHeight: 18, marginTop: 4 }}>It does not move or verify the payment.</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}
          accessibilityLabel="I confirm this payment happened outside MoneyKai"
          onPress={() => setConfirmed((value) => !value)}
          style={{ alignItems: 'flex-start', borderColor: confirmed ? colors.primary : colors.border, borderRadius: BorderRadius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg, minHeight: 56, padding: Spacing.md }}
        >
          <View style={{ alignItems: 'center', backgroundColor: confirmed ? colors.primary : colors.surface, borderColor: confirmed ? colors.primaryDark : colors.textSecondary, borderRadius: 5, borderWidth: 2, height: 24, justifyContent: 'center', width: 24 }}>
            {confirmed ? <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: 18, lineHeight: 21 }}>✓</Text> : null}
          </View>
          <Text style={{ color: colors.textPrimary, flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 20 }}>I confirm this payment happened outside MoneyKai.</Text>
        </TouchableOpacity>
      </ModalSheet>
    );
  }

  return (
    <ModalSheet
      visible={props.visible}
      title={props.group?.name ?? 'Group ledger'}
      subtitle={`${props.group?.members?.length ?? 0} people · shared ledger`}
      onClose={props.onClose}
      maxHeight={790}
      footer={(
        <View style={{ gap: Spacing.sm }}>
          <Button title={summary.state === 'EMPTY' ? 'Add expense' : 'Add another expense'} icon="plus" onPress={props.onAddExpense} fullWidth />
          <Button title={props.group?.pending_action ? 'Group update awaiting confirmation' : props.group?.archived ? 'Restore group' : 'Archive group'} variant="outline" icon="archive-outline" onPress={props.onArchive} disabled={props.group?.sync_status !== 'confirmed'} fullWidth />
        </View>
      )}
    >
      <View accessible accessibilityLabel={`Total spent ${formatPaise(summary.totalExpensePaise, props.currencySymbol)}. You're owed ${formatPaise(position.owedPaise, props.currencySymbol)}. You owe ${formatPaise(position.owePaise, props.currencySymbol)}.`} style={{ borderBottomColor: colors.borderLight, borderBottomWidth: 1, marginBottom: Spacing.lg, paddingBottom: Spacing.lg }}>
        <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm }}>Total spent</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: 30, marginTop: Spacing.xs }}>{formatPaise(summary.totalExpensePaise, props.currencySymbol)}</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: TransactionDirectionColorOnDark.credit, backgroundColor: colors.textPrimary, alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm, fontSize: Typography.fontSize.xs }}>You are owed</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl, marginTop: 3 }}>{formatPaise(position.owedPaise, props.currencySymbol)}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: TransactionDirectionColorOnDark.debit, backgroundColor: colors.textPrimary, alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm, fontSize: Typography.fontSize.xs }}>You owe</Text>
            <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl, marginTop: 3 }}>{formatPaise(position.owePaise, props.currencySymbol)}</Text>
          </View>
        </View>
        {summary.state === 'SETTLED' ? <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, marginTop: Spacing.md }}>✓ All settled</Text> : null}
        <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: Spacing.md }}>
          {isOnline ? 'Confirmed shared records only.' : 'Offline · saved, confirmed records only.'}
        </Text>
        {confirmationCounts.pending + confirmationCounts.failed > 0 ? (
          <Text accessibilityRole="alert" style={{ color: confirmationCounts.failed > 0 ? colors.error : colors.textSecondary, fontSize: Typography.fontSize.xs, lineHeight: 18, marginTop: 4 }}>
            {confirmationCounts.pending} pending · {confirmationCounts.failed} failed records. Unconfirmed expenses and settlements do not change this balance.
          </Text>
        ) : null}
      </View>

      <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: balanceExplanationOpen }} accessibilityLabel={balanceExplanationOpen ? 'Hide balance breakdown' : 'How balances are calculated'} onPress={() => setBalanceExplanationOpen((value) => !value)} style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 44, marginBottom: Spacing.sm }}>
        <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>How balances are calculated</Text>
        <MaterialCommunityIcons name={balanceExplanationOpen ? 'chevron-up' : 'chevron-down'} color={colors.textSecondary} size={20} />
      </TouchableOpacity>
      {balanceExplanationOpen ? (
        <View style={{ backgroundColor: colors.surface, borderColor: colors.borderLight, borderRadius: BorderRadius.md, borderWidth: 1, gap: Spacing.sm, marginBottom: Spacing.lg, padding: Spacing.md }}>
          {confirmedExpenses.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs }}>No confirmed expenses contribute yet. Pending records stay in history below.</Text>
          ) : confirmedExpenses.map((expense) => {
            const contribution = getExpenseBalanceContributionPaise(expense, props.currentUser.id);
            return (
              <View key={expense.id} style={{ borderBottomColor: colors.borderLight, borderBottomWidth: 1, paddingBottom: Spacing.sm }}>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, justifyContent: 'space-between' }}>
                  <Text numberOfLines={1} style={{ color: colors.textPrimary, flex: 1, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>{expense.description}</Text>
                  <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>{contribution < 0 ? '−' : '+'}{formatPaise(Math.abs(contribution), props.currencySymbol)}</Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: 2 }}>
                  {expense.occurred_on || expense.created_at.slice(0, 10)} · {expense.paid_by_name || 'a participant'} paid {formatPaise(getExpensePaise(expense), props.currencySymbol)}
                </Text>
              </View>
            );
          })}
          <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, lineHeight: 18 }}>Positive amounts are owed to you; negative amounts are your unpaid shares. Open an expense below for exact shares and recorded settlements.</Text>
          <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>Net {summary.currentUserBalancePaise < 0 ? '−' : '+'}{formatPaise(Math.abs(summary.currentUserBalancePaise), props.currencySymbol)}</Text>
        </View>
      ) : null}

      {summary.state === 'EMPTY' ? (
        <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
          <MaterialCommunityIcons name="receipt-text-outline" color={colors.textTertiary} size={27} />
          <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize.xl, marginTop: Spacing.md }}>No expenses yet</Text>
          <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 20, marginTop: 4, textAlign: 'center' }}>Add the first expense when it happens.</Text>
        </View>
      ) : (
        <>
          <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize.xl, marginBottom: Spacing.sm }}>People</Text>
          {props.expenses.filter((expense) => expense.sync_status !== 'pending' && expense.sync_status !== 'failed').flatMap((expense) => (expense.splits ?? []).filter((split) => split.user_id !== expense.paid_by).map((split) => ({ expense, split, open: getSplitOutstandingPaise(expense, split) }))).map(({ expense, split, open }) => (
            <View key={`${expense.id}-${split.id}`} style={{ alignItems: 'center', borderBottomColor: colors.borderLight, borderBottomWidth: 1, flexDirection: 'row', gap: Spacing.sm, minHeight: 54, paddingVertical: Spacing.sm }}>
              <View style={{ alignItems: 'center', backgroundColor: open === 0 ? colors.primaryBg : colors.surfaceElevated, borderRadius: BorderRadius.full, height: 38, justifyContent: 'center', width: 38 }}>
                <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>{(split.user_name || 'P').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>{split.user_name || 'Participant'}</Text>
                <Text accessibilityLabel={open === 0 ? `${split.user_name || 'Participant'} is settled` : describeBalance(split.user_name || 'Participant', expense.paid_by_name || 'Payer', open, props.currentUser.id, split.user_id, expense.paid_by, props.currencySymbol)} numberOfLines={2} style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: 2 }}>
                  {open === 0 ? 'Settled' : describeBalance(split.user_name || 'Participant', expense.paid_by_name || 'Payer', open, props.currentUser.id, split.user_id, expense.paid_by, props.currencySymbol).replace(`${split.user_name || 'Participant'} `, '')}
                </Text>
              </View>
              {open > 0 && (expense.settlements ?? []).some((event) => event.split_id === split.id && event.sync_status !== 'confirmed')
                ? <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs }}>Awaiting confirmation</Text>
                : open > 0 ? <Button title="Record settlement" variant="outline" size="sm" onPress={() => openSettlement(expense, split)} /> : null}
            </View>
          ))}

          <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base, marginBottom: Spacing.sm, marginTop: Spacing.lg }}>Ledger history</Text>
          {error ? <Text accessibilityRole="alert" style={{ color: colors.error, fontSize: Typography.fontSize.xs }}>{error}</Text> : null}
          {history.map((entry) => {
            const { expense } = entry;
            if (entry.kind === 'expense') return (
              <View key={entry.id} style={{ marginBottom: Spacing.md }}>
                <LedgerEvent icon="receipt-text-outline" title={expense.description} detail={`Expense · ${expense.paid_by_name || 'a participant'} paid ${formatPaise(getExpensePaise(expense), props.currencySymbol)}`} status={expense.sync_status} statusError={expense.sync_error} />
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${expandedExpenseId === expense.id ? 'Hide' : 'Show'} full arithmetic for ${expense.description}`} onPress={() => setExpandedExpenseId((current) => current === expense.id ? undefined : expense.id)} style={{ alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44, marginLeft: 34 }}>
                  <Text style={{ color: colors.primaryDark, fontSize: Typography.fontSize.xs, textDecorationLine: 'underline' }}>{expandedExpenseId === expense.id ? 'Hide full math' : 'See full math'}</Text>
                </TouchableOpacity>
                {expandedExpenseId === expense.id ? <ExpenseMath expense={expense} currencySymbol={props.currencySymbol} /> : null}
                {expense.sync_status && expense.sync_status !== 'confirmed' ? <Button title="Retry expense confirmation" variant="ghost" size="sm" onPress={() => void retryExpense(expense.id)} /> : null}
              </View>
            );
            const { settlement } = entry;
            return (
              <View key={entry.id} style={{ marginBottom: Spacing.md }}>
                <LedgerEvent icon={settlement.kind === 'reversal' ? 'undo-variant' : 'handshake-outline'} title={settlement.kind === 'reversal' ? 'Settlement correction' : `${settlement.from_user_name || 'Participant'} settlement`} detail={`${settlement.sync_status === 'confirmed' ? settlement.kind === 'reversal' ? 'Reversed' : 'Recorded' : settlement.kind === 'reversal' ? 'Correction awaiting confirmation for' : 'Awaiting confirmation for'} ${formatPaise(settlement.amount_paise, props.currencySymbol)} · ${settlement.settled_at.slice(0, 10)} · money was not moved by MoneyKai`} status={settlement.sync_status} statusError={settlement.sync_error} />
                {settlement.kind === 'recorded' && settlement.sync_status !== 'confirmed' ? (
                  <Button title={retryingId === settlement.mutation_id ? 'Checking confirmation' : 'Retry confirmation'} variant="ghost" size="sm" disabled={Boolean(retryingId)} onPress={() => void retrySettlement(expense, settlement)} />
                ) : null}
                {settlement.kind === 'reversal' && settlement.sync_status !== 'confirmed' ? (
                  <Button title={retryingId === settlement.mutation_id ? 'Checking correction' : 'Retry correction'} variant="ghost" size="sm" disabled={Boolean(retryingId)} onPress={() => void retryReversal(expense, settlement)} />
                ) : null}
                {settlement.kind === 'recorded' && settlement.sync_status === 'confirmed' && !(expense.settlements ?? []).some((event) => event.reverses_settlement_id === settlement.id) ? (
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Reverse ${settlement.from_user_name || 'participant'} settlement record`} onPress={() => Alert.alert('Correct settlement record?', 'This adds an auditable reversal event. The original record remains visible.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Add reversal', onPress: () => void props.onReverseSettlement(expense.id, settlement.id, createClientMutationId('reversal')) }])} style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginLeft: 34 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, textDecorationLine: 'underline' }}>Correct this record</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </>
      )}
      {props.group ? (
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Share this group's ledger as CSV text" onPress={shareLedger} style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, minHeight: 44, marginTop: Spacing.md }}>
          <MaterialCommunityIcons name="share-variant-outline" color={colors.textSecondary} size={18} />
          <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, textDecorationLine: 'underline' }}>Share ledger CSV text</Text>
        </TouchableOpacity>
      ) : null}
    </ModalSheet>
  );
}

function LedgerEvent({ icon, title, detail, status, statusError }: { icon: string; title: string; detail: string; status?: string; statusError?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.sm }}>
      <MaterialCommunityIcons name={icon} color={colors.primaryDark} size={20} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>{title}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, lineHeight: 17, marginTop: 2 }}>{detail}</Text>
        {status && status !== 'confirmed' ? <Text style={{ color: status === 'failed' ? colors.error : colors.warning, fontSize: Typography.fontSize.xs, marginTop: 3 }}>{status === 'failed' ? 'Sync failed · retry available' : statusError ? 'Confirmation unknown · retry this record' : 'Pending synchronization'}</Text> : null}
      </View>
    </View>
  );
}

function ExpenseMath({ expense, currencySymbol }: { expense: GroupExpense; currencySymbol: string }) {
  const { colors } = useTheme();
  const splits = expense.splits ?? [];
  const allocated = splits.reduce((sum, split) => sum + getSplitPaise(split), 0);
  return (
    <View style={{ backgroundColor: colors.surface, borderColor: colors.borderLight, borderRadius: BorderRadius.md, borderWidth: 1, gap: Spacing.sm, marginBottom: Spacing.sm, padding: Spacing.md }}>
      <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>Full arithmetic</Text>
      <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs }}>Date {expense.occurred_on || expense.created_at.slice(0, 10)} · Paid by {expense.paid_by_name || 'a participant'}</Text>
      <Text style={{ color: colors.textPrimary, fontSize: Typography.fontSize.sm }}>Total {formatPaise(getExpensePaise(expense), currencySymbol)}</Text>
      {splits.map((split) => (
        <View key={split.id} style={{ gap: 2 }}>
          <View style={{ alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.sm, justifyContent: 'space-between' }}>
            <Text numberOfLines={2} style={{ color: colors.textSecondary, flex: 1, fontSize: Typography.fontSize.sm }}>{split.user_name || 'Participant'}</Text>
            <Text style={{ color: colors.textPrimary, fontSize: Typography.fontSize.sm }}>{formatPaise(getSplitPaise(split), currencySymbol)}</Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs }}>
            {split.user_id === expense.paid_by ? 'Paid as the payer' : `Recorded ${formatPaise(getSplitSettledPaise(expense, split.id), currencySymbol)} · Open ${formatPaise(getSplitOutstandingPaise(expense, split), currencySymbol)}`}
          </Text>
        </View>
      ))}
      <Text accessibilityLabel={`Shares add to ${formatPaise(allocated, currencySymbol)}`} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>Shares total {formatPaise(allocated, currencySymbol)}</Text>
    </View>
  );
}
