import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/utils/formatCurrency';
import type { MoneyRecordsSortKey } from './moneyRecords.types';

const displayText = (value: string) => value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

interface Props {
  transactions: Transaction[];
  compact: boolean;
  selectedIds: ReadonlySet<string>;
  sortKey: MoneyRecordsSortKey;
  descending: boolean;
  allSelected: boolean;
  someSelected: boolean;
  onToggleSort: (key: MoneyRecordsSortKey) => void;
  onToggleTransaction: (id: string) => void;
  onToggleAll: () => void;
  onViewAll: () => void;
}

export function AnalyticsTransactionsTable({ transactions, compact, selectedIds, sortKey, descending, allSelected, someSelected, onToggleSort, onToggleTransaction, onToggleAll, onViewAll }: Props) {
  const { colors } = useTheme();
  return (
    <>
      {transactions.length ? (compact ? (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.borderLight }}>
          {transactions.map((transaction) => <CompactRecordRow key={transaction.id} transaction={transaction} selected={selectedIds.has(transaction.id)} onToggle={() => onToggleTransaction(transaction.id)} />)}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderTopWidth: 1, borderTopColor: colors.borderLight }}>
          <View style={{ minWidth: 900, flex: 1 }}>
            <View style={{ minHeight: 48, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated }}>
              <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: allSelected ? true : someSelected ? 'mixed' : false }} accessibilityLabel={allSelected ? 'Clear all visible record selections' : 'Select all visible records'} onPress={onToggleAll} style={{ width: 42, minHeight: 44, justifyContent: 'center' }}>
                <MaterialCommunityIcons name={allSelected ? 'checkbox-marked' : someSelected ? 'minus-box' : 'checkbox-blank-outline'} size={20} color={allSelected || someSelected ? colors.primary : colors.textTertiary} />
              </TouchableOpacity>
              <SortableHeader label="Record" active={sortKey === 'description'} descending={descending} onPress={() => onToggleSort('description')} style={{ flex: 2 }} />
              <Text style={{ flex: 1.1, fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>CATEGORY</Text>
              <Text style={{ flex: 1.1, fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>SOURCE</Text>
              <SortableHeader label="Date" active={sortKey === 'date'} descending={descending} onPress={() => onToggleSort('date')} style={{ flex: 1 }} />
              <SortableHeader label="Amount" active={sortKey === 'amount'} descending={descending} onPress={() => onToggleSort('amount')} style={{ flex: 1, justifyContent: 'flex-end' }} />
            </View>
            {transactions.map((transaction) => <DesktopRecordRow key={transaction.id} transaction={transaction} selected={selectedIds.has(transaction.id)} onToggle={() => onToggleTransaction(transaction.id)} />)}
          </View>
        </ScrollView>
      )) : (
        <View accessibilityRole="summary" style={{ minHeight: 250, borderTopWidth: 1, borderTopColor: colors.borderLight, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }}><MaterialCommunityIcons name="text-box-search-outline" size={34} color={colors.textTertiary} /><Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>No matching records</Text><Text style={{ marginTop: 4, textAlign: 'center', fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Change the period or filter, or add a reviewed transaction.</Text></View>
      )}
      <TouchableOpacity accessibilityRole="button" onPress={onViewAll} style={{ minHeight: 54, paddingHorizontal: Spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>View all transactions</Text><MaterialCommunityIcons name="arrow-right" size={18} color={colors.textPrimary} /></TouchableOpacity>
    </>
  );
}

function RecordSelectionIcon({ selected }: { selected: boolean }) {
  const { colors } = useTheme();
  return <MaterialCommunityIcons name={selected ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={selected ? colors.primary : colors.textTertiary} />;
}

function CompactRecordRow({ transaction, selected, onToggle }: { transaction: Transaction; selected: boolean; onToggle: () => void }) {
  const { colors } = useTheme();
  const income = transaction.type === 'income';
  return (
    <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={`${selected ? 'Deselect' : 'Select'} ${transaction.description || displayText(transaction.category)}, ${income ? 'income' : 'expense'} ${formatCurrency(transaction.amount)}`} onPress={onToggle} style={{ padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: selected ? colors.primaryBg : 'transparent', flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
      <RecordSelectionIcon selected={selected} />
      <View style={{ width: 38, height: 38, borderRadius: BorderRadius.md, backgroundColor: income ? `${colors.success}18` : `${colors.warning}18`, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name={income ? 'arrow-bottom-left' : 'arrow-top-right'} size={18} color={income ? colors.success : colors.warning} /></View>
      <View style={{ flex: 1, minWidth: 0 }}><Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }} numberOfLines={1}>{transaction.description || displayText(transaction.category)}</Text><Text style={{ marginTop: 3, fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>{displayText(transaction.category)} · {transaction.transaction_date}</Text></View>
      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: income ? colors.success : colors.textPrimary }}>{income ? '+' : '-'}{formatCurrency(transaction.amount)}</Text>
    </TouchableOpacity>
  );
}

function DesktopRecordRow({ transaction, selected, onToggle }: { transaction: Transaction; selected: boolean; onToggle: () => void }) {
  const { colors } = useTheme();
  const income = transaction.type === 'income';
  return (
    <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={`${selected ? 'Deselect' : 'Select'} ${transaction.description || displayText(transaction.category)}, ${income ? 'income' : 'expense'} ${formatCurrency(transaction.amount)}`} onPress={onToggle} style={{ minHeight: 64, paddingHorizontal: Spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight, backgroundColor: selected ? colors.primaryBg : colors.card, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 42 }}><RecordSelectionIcon selected={selected} /></View>
      <View style={{ flex: 2, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}><View style={{ width: 34, height: 34, borderRadius: BorderRadius.sm, backgroundColor: income ? `${colors.success}18` : `${colors.warning}18`, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name={income ? 'arrow-bottom-left' : 'arrow-top-right'} size={17} color={income ? colors.success : colors.warning} /></View><View style={{ flex: 1, minWidth: 0 }}><Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }} numberOfLines={1}>{transaction.description || displayText(transaction.category)}</Text><Text style={{ marginTop: 2, fontSize: 10, color: colors.textTertiary }}>{displayText(transaction.type)}</Text></View></View>
      <Text style={{ flex: 1.1, fontSize: Typography.fontSize.xs, color: colors.textSecondary }} numberOfLines={1}>{displayText(transaction.category)}</Text>
      <Text style={{ flex: 1.1, fontSize: Typography.fontSize.xs, color: colors.textSecondary }} numberOfLines={1}>{displayText(transaction.captureSource ?? 'manual')}</Text>
      <Text style={{ flex: 1, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{transaction.transaction_date}</Text>
      <Text style={{ flex: 1, textAlign: 'right', fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: income ? colors.success : colors.textPrimary }}>{income ? '+' : '-'}{formatCurrency(transaction.amount)}</Text>
    </TouchableOpacity>
  );
}

function SortableHeader({ label, active, descending, onPress, style }: { label: string; active: boolean; descending: boolean; onPress: () => void; style?: object }) {
  const { colors } = useTheme();
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Sort by ${label}`} onPress={onPress} style={[{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 }, style]}><Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: active ? colors.textPrimary : colors.textTertiary }}>{label.toUpperCase()}</Text><MaterialCommunityIcons name={active ? (descending ? 'arrow-down' : 'arrow-up') : 'unfold-more-horizontal'} size={14} color={active ? colors.primary : colors.textTertiary} /></TouchableOpacity>;
}
