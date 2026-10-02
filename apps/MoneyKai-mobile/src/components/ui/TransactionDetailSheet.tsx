import React from 'react';
import { Alert, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon } from './AppIcon';
import { Button } from './Button';
import { Disclosure } from './Disclosure';
import { ModalSheet } from './ModalSheet';
import { BorderRadius, Spacing, TransactionDirectionColor, Typography } from '@/constants/theme';
import { PAYMENT_METHODS, getCategoryById } from '@/constants/categories';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import type { Transaction, TransactionCaptureSource } from '@/types/transaction';
import { titleCase } from '@/utils/labels';
import { summarizePeople } from '@/utils/contactAllocations';
import { CounterpartyNickname } from '@/components/transactions/CounterpartyNickname';
import { useTransactionLabels } from '@/hooks/useTransactionLabels';

const SOURCE_LABELS: Record<TransactionCaptureSource, string> = {
  notification: 'Notification',
  sms: 'SMS',
  aa: 'Account Aggregator',
  gmail: 'Gmail',
  pdf: 'PDF statement',
  portfolio: 'Portfolio',
  manual: 'Manual entry',
};

const formatDate = (value: string) => {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
};

const formatTimestamp = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        alignItems: 'flex-start',
        borderBottomColor: colors.borderLight,
        borderBottomWidth: 1,
        flexDirection: 'row',
        gap: Spacing.md,
        justifyContent: 'space-between',
        minHeight: 48,
        paddingVertical: Spacing.sm,
      }}
    >
      <Text style={{ color: colors.textSecondary, flex: 0.42, fontSize: Typography.fontSize.sm }}>{label}</Text>
      <Text
        selectable
        style={{
          color: colors.textPrimary,
          flex: 0.58,
          fontFamily: Typography.fontFamily.medium,
          fontSize: Typography.fontSize.sm,
          lineHeight: Typography.lineHeight.sm,
          textAlign: 'right',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

interface TransactionDetailSheetProps {
  transaction: Transaction;
  onClose: () => void;
  onEdit: () => void;
  onSplit?: () => void;
  onDeleted: () => void;
}

export function TransactionDetailSheet({ transaction, onClose, onEdit, onSplit, onDeleted }: TransactionDetailSheetProps) {
  const { colors } = useTheme();
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransactionDurable);
  const displayName = useTransactionLabels();
  const category = getCategoryById(transaction.category)?.name ?? titleCase(transaction.category);
  const paymentMethod = PAYMENT_METHODS.find((item) => item.id === transaction.payment_method)?.name
    ?? titleCase(transaction.payment_method);
  const source = transaction.captureSource ? SOURCE_LABELS[transaction.captureSource] : 'Manual entry';
  const account = transaction.captureAccountLabel ?? transaction.captureBankLabel ?? transaction.captureAccountHint;
  const amount = `${transaction.type === 'income' ? '+' : '-'}${currencySymbol}${transaction.amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;

  const confirmDelete = () => {
    Alert.alert(
      'Delete transaction?',
      'This removes the local record and attempts to remove its synced copy. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
            onPress: async () => {
              try { await deleteTransaction(transaction.id); onDeleted(); }
              catch { Alert.alert('Could not remove transaction','The saved record is preserved. Try again.'); }
          },
        },
      ]
    );
  };

  return (
    <ModalSheet
      visible
      title="Transaction details"
      subtitle="Everything saved with this record."
      onClose={onClose}
      maxHeight={760}
      expandable
      footer={
        <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
          {transaction.type === 'expense' && onSplit ? <Button title="Split expense" icon="account-group-outline" onPress={onSplit} fullWidth /> : null}
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <Button
            title="Edit"
            icon="pencil-outline"
            variant="outline"
            onPress={onEdit}
            style={{ flex: 1 }}
            accessibilityHint="Opens every editable field for this transaction"
          />
          <Button
            title="Delete"
            icon="trash-can-outline"
            variant="outline"
            onPress={confirmDelete}
            style={{ flex: 1 }}
            textStyle={{ color: TransactionDirectionColor.debit }}
            accessibilityHint="Permanently removes this transaction after confirmation"
          />
          </View>
        </View>
      }
    >
      <View
        style={{
          backgroundColor: colors.primaryBg,
          borderColor: colors.border,
          borderRadius: BorderRadius.lg,
          borderWidth: 1,
          marginBottom: Spacing.lg,
          padding: Spacing.lg,
        }}
      >
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.sm }}>
          <View
            style={{
              alignItems: 'center',
              backgroundColor: colors.card,
              borderRadius: BorderRadius.full,
              height: 40,
              justifyContent: 'center',
              width: 40,
            }}
          >
            <AppIcon
              name={transaction.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'}
              size={20}
              color={transaction.type === 'income' ? TransactionDirectionColor.credit : TransactionDirectionColor.debit}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, textTransform: 'uppercase' }}>
              {transaction.type === 'income' ? 'Credit' : 'Debit'}
            </Text>
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={{
                color: transaction.type === 'income' ? TransactionDirectionColor.credit : TransactionDirectionColor.debit,
                fontFamily: Typography.fontFamily.display,
                fontSize: Typography.fontSize['4xl'],
                lineHeight: Typography.lineHeight['4xl'],
                marginTop: 2,
              }}
            >
              {amount}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginBottom: Spacing.lg }}>
        <Text
          style={{
            color: colors.textTertiary,
            fontFamily: Typography.fontFamily.semiBold,
            fontSize: Typography.fontSize.xs,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
          }}
        >
          Full description
        </Text>
        <Text
          selectable
          style={{
            color: colors.textPrimary,
            fontFamily: Typography.fontFamily.regular,
            fontSize: Typography.fontSize.md,
            lineHeight: Typography.lineHeight.md,
            marginTop: Spacing.sm,
          }}
        >
          {transaction.description?.trim() || 'No description was added.'}
        </Text>
      </View>

      <Disclosure title="Display name" summary={displayName(transaction)}>
        <CounterpartyNickname transaction={transaction} />
      </Disclosure>

      <View style={{ borderTopColor: colors.borderLight, borderTopWidth: 1 }}>
        <DetailRow label="Category" value={category} />
        <DetailRow label="Payment method" value={paymentMethod} />
        {transaction.contact_allocations?.length ? <DetailRow label="People" value={summarizePeople(transaction.contact_allocations)} /> : null}
        <DetailRow label="Transaction date" value={formatDate(transaction.transaction_date)} />
        <DetailRow label="Source" value={source} />
         {transaction.automaticallyRecorded ? <DetailRow label="Recording" value="Automatically added · check category and details" /> : null}
        {account ? <DetailRow label="Account" value={account} /> : null}
        {transaction.receipt_url ? <DetailRow label="Receipt" value="Attached" /> : null}
      </View>

      {transaction.contact_allocations && transaction.contact_allocations.length > 1 ? <Disclosure title="People amounts" summary={`${transaction.contact_allocations.length} people · ${transaction.contact_split_mode === 'custom' ? 'Custom' : 'Equal'} split`}>
        {transaction.contact_allocations.map((person) => <DetailRow key={person.contactId} label={person.name} value={`${currencySymbol}${person.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />)}
      </Disclosure> : null}

      <Disclosure title="Record information" summary={`Added ${formatTimestamp(transaction.created_at)}`}>
        <DetailRow label="Added" value={formatTimestamp(transaction.created_at)} />
        <DetailRow label="Record ID" value={transaction.id} />
      </Disclosure>
    </ModalSheet>
  );
}

export default TransactionDetailSheet;
