import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getCategoryById } from '../../constants/categories';
import { BorderRadius, Spacing, Typography } from '../../constants/theme';
import type { Transaction } from '../../types/transaction';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateUtils';
import { withAlpha } from '../../utils/glassStyle';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

interface CashflowRecentTransactionsProps {
  transactions: Transaction[];
  onViewAll: () => void;
}

const humanize = (value: string) => value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const getAccountLabel = (transaction: Transaction) =>
  transaction.captureAccountLabel || transaction.captureBankLabel || humanize(transaction.payment_method);

export function CashflowRecentTransactions({ transactions, onViewAll }: CashflowRecentTransactionsProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const visibleTransactions = [...transactions]
    .sort((left, right) =>
      right.transaction_date.localeCompare(left.transaction_date) ||
      right.created_at.localeCompare(left.created_at) ||
      left.id.localeCompare(right.id))
    .slice(0, 5);

  const renderAmount = (transaction: Transaction) => {
    const isExpense = transaction.type === 'expense';
    return {
      label: `${isExpense ? '-' : '+'}${formatCurrency(transaction.amount)}`,
      color: isExpense ? colors.error : colors.success,
    };
  };

  return (
    <View testID="recent-transactions" style={styles.root}>
      <Card variant="glass">
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>Recent transactions</Text>
          <Button title="View all" variant="ghost" size="sm" onPress={onViewAll} />
        </View>

        {visibleTransactions.length === 0 ? (
          <EmptyState
            icon="receipt-text-outline"
            title="No transactions in this reporting period"
            message="Reviewed income and expenses will appear here once they are added."
            action={<Button title="View transactions" size="sm" variant="outline" onPress={onViewAll} />}
            style={styles.emptyState}
          />
        ) : isDesktop ? (
          <View accessibilityRole="list" style={[styles.table, { borderColor: colors.borderLight }]}>
            <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: withAlpha(colors.primary, 0.06), borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.columnHeader, styles.payeeColumn, { color: colors.textTertiary }]}>Payee</Text>
              <Text style={[styles.columnHeader, styles.categoryColumn, { color: colors.textTertiary }]}>Category</Text>
              <Text style={[styles.columnHeader, styles.accountColumn, { color: colors.textTertiary }]}>Account</Text>
              <Text style={[styles.columnHeader, styles.dateColumn, { color: colors.textTertiary }]}>Date</Text>
              <Text style={[styles.columnHeader, styles.amountColumn, { color: colors.textTertiary }]}>Amount</Text>
            </View>
            {visibleTransactions.map((transaction, index) => {
              const category = getCategoryById(transaction.category);
              const categoryName = category?.name ?? humanize(transaction.category);
              const account = getAccountLabel(transaction);
              const amount = renderAmount(transaction);
              const date = formatDate(transaction.transaction_date, 'dd MMM yyyy');

              return (
                <View
                  key={transaction.id}
                  accessibilityRole="summary"
                  accessibilityLabel={`${transaction.description}, ${categoryName}, ${account}, ${date}, ${amount.label}.`}
                  style={[
                    styles.tableRow,
                    index > 0 ? { borderTopWidth: 1, borderTopColor: colors.borderLight } : null,
                  ]}
                >
                  <View style={[styles.payeeColumn, styles.payeeCell]}>
                    <View style={[styles.transactionIcon, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
                      <MaterialCommunityIcons
                        name={(category?.icon ?? 'receipt-outline') as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={17}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={[styles.cellPrimary, { color: colors.textPrimary }]} numberOfLines={1}>{transaction.description}</Text>
                  </View>
                  <Text style={[styles.cellSecondary, styles.categoryColumn, { color: colors.textSecondary }]} numberOfLines={1}>{categoryName}</Text>
                  <Text style={[styles.cellSecondary, styles.accountColumn, { color: colors.textSecondary }]} numberOfLines={1}>{account}</Text>
                  <Text style={[styles.cellSecondary, styles.dateColumn, { color: colors.textSecondary }]} numberOfLines={1}>{date}</Text>
                  <Text style={[styles.cellAmount, styles.amountColumn, { color: amount.color }]} numberOfLines={1}>{amount.label}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View accessibilityRole="list" style={styles.mobileList}>
            {visibleTransactions.map((transaction, index) => {
              const category = getCategoryById(transaction.category);
              const categoryName = category?.name ?? humanize(transaction.category);
              const account = getAccountLabel(transaction);
              const amount = renderAmount(transaction);
              const date = formatDate(transaction.transaction_date, 'dd MMM yyyy');

              return (
                <View
                  key={transaction.id}
                  accessibilityRole="summary"
                  accessibilityLabel={`${transaction.description}, ${categoryName}, ${account}, ${date}, ${amount.label}.`}
                  style={[
                    styles.mobileRow,
                    index > 0 ? { borderTopWidth: 1, borderTopColor: colors.borderLight } : null,
                  ]}
                >
                  <View style={[styles.transactionIcon, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
                    <MaterialCommunityIcons
                      name={(category?.icon ?? 'receipt-outline') as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.mobileBody}>
                    <View style={styles.mobileTopline}>
                      <Text style={[styles.mobilePayee, { color: colors.textPrimary }]} numberOfLines={1}>{transaction.description}</Text>
                      <Text style={[styles.cellAmount, { color: amount.color }]} numberOfLines={1}>{amount.label}</Text>
                    </View>
                    <Text style={[styles.mobileMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                      {categoryName} · {account} · {date}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { minWidth: 0 },
  header: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing.md },
  title: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.md, lineHeight: Typography.lineHeight.md, fontFamily: Typography.fontFamily.semiBold },
  table: { minWidth: 0, borderWidth: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  tableRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, gap: Spacing.md },
  tableHeader: { minHeight: 40, borderBottomWidth: 1 },
  columnHeader: { fontSize: Typography.fontSize.xs, lineHeight: Typography.lineHeight.xs, fontFamily: Typography.fontFamily.semiBold, textTransform: 'uppercase', letterSpacing: 0.4 },
  payeeColumn: { flex: 1.6, minWidth: 0 },
  categoryColumn: { flex: 1.2, minWidth: 0 },
  accountColumn: { flex: 1.3, minWidth: 0 },
  dateColumn: { flex: 1, minWidth: 0 },
  amountColumn: { flex: 1, minWidth: 0, textAlign: 'right' },
  payeeCell: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  transactionIcon: { width: 34, height: 34, flexShrink: 0, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  cellPrimary: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, fontFamily: Typography.fontFamily.medium },
  cellSecondary: { fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, fontFamily: Typography.fontFamily.regular },
  cellAmount: { flexShrink: 1, minWidth: 0, fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, fontFamily: Typography.fontFamily.semiBold, textAlign: 'right' },
  mobileList: { minWidth: 0 },
  mobileRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, minWidth: 0 },
  mobileBody: { flex: 1, minWidth: 0 },
  mobileTopline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minWidth: 0 },
  mobilePayee: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.base, lineHeight: Typography.lineHeight.base, fontFamily: Typography.fontFamily.medium },
  mobileMeta: { marginTop: Spacing.xs, fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, fontFamily: Typography.fontFamily.regular },
  emptyState: { paddingVertical: Spacing.xl },
});

export default CashflowRecentTransactions;
