import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getCategoryById } from '../../constants/categories';
import { BorderRadius, Spacing, Typography } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateUtils';
import type { RecurringCommitment } from '../../utils/cashflowPlan';
import { withAlpha } from '../../utils/glassStyle';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

interface CashflowCommitmentsProps {
  commitments: RecurringCommitment[];
  onViewAll: () => void;
}

const humanize = (value: string) => value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export function CashflowCommitments({ commitments, onViewAll }: CashflowCommitmentsProps) {
  const { colors } = useTheme();
  const visibleCommitments = [...commitments]
    .sort((left, right) => left.projectedDate.localeCompare(right.projectedDate) || left.id.localeCompare(right.id))
    .slice(0, 4);

  return (
    <View testID="estimated-commitments" style={styles.root}>
      <Card variant="glass" padding="md" style={styles.card}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>Upcoming bills</Text>
          <Button title="View all" variant="ghost" size="sm" onPress={onViewAll} />
        </View>
        <Text style={[styles.disclosure, { color: colors.textSecondary }]}>Based on stable monthly patterns in reviewed transaction history.</Text>

        {visibleCommitments.length === 0 ? (
          <EmptyState
            icon="calendar-sync-outline"
            title="No stable recurring pattern detected."
            message="Reviewed history will appear here when a consistent monthly pattern is found."
            style={styles.emptyState}
          />
        ) : (
          <View accessibilityRole="list" style={styles.list}>
            {visibleCommitments.map((commitment, index) => {
              const category = getCategoryById(commitment.category);
              const isExpense = commitment.type === 'expense';
              const amountColor = isExpense ? colors.warning : colors.success;
              const signedAmount = `${isExpense ? '-' : '+'}${formatCurrency(commitment.amount)}`;
              const categoryName = category?.name ?? humanize(commitment.category);
              const sourceCount = commitment.sourceTransactionIds.length;

              return (
                <View
                  key={commitment.id}
                  accessibilityRole="summary"
                  accessibilityLabel={`${commitment.label}, estimated ${commitment.type} ${signedAmount}, ${categoryName}, projected ${formatDate(commitment.projectedDate, 'dd MMM yyyy')}, based on ${sourceCount} reviewed transactions.`}
                  style={[
                    styles.row,
                    index > 0 ? { borderTopWidth: 1, borderTopColor: colors.borderLight } : null,
                  ]}
                >
                  <View style={[styles.icon, { backgroundColor: withAlpha(amountColor, 0.12), borderColor: withAlpha(amountColor, 0.24) }]}>
                    <MaterialCommunityIcons
                      name={(category?.icon ?? (isExpense ? 'calendar-arrow-right' : 'calendar-arrow-left')) as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={20}
                      color={amountColor}
                    />
                  </View>
                  <View style={styles.body}>
                    <View style={styles.topline}>
                      <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={1}>{commitment.label}</Text>
                      <Text style={[styles.amount, { color: amountColor }]} numberOfLines={1}>{signedAmount}</Text>
                    </View>
                    <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                      {formatDate(commitment.projectedDate, 'dd MMM yyyy')} · {categoryName}
                    </Text>
                    <View style={styles.provenance}>
                      <MaterialCommunityIcons name="history" size={14} color={colors.textTertiary} />
                      <Text style={[styles.provenanceText, { color: colors.textTertiary }]} numberOfLines={1}>
                        Estimated from {sourceCount} reviewed {sourceCount === 1 ? 'transaction' : 'transactions'}
                      </Text>
                    </View>
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
  root: { flex: 1, minWidth: 0 },
  card: { flex: 1, minWidth: 0 },
  header: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  title: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.md, lineHeight: Typography.lineHeight.md, fontFamily: Typography.fontFamily.semiBold },
  disclosure: { display: 'none', marginTop: Spacing.xs, fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, fontFamily: Typography.fontFamily.regular },
  list: { marginTop: 4, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4, minWidth: 0 },
  icon: { width: 30, height: 30, borderRadius: BorderRadius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  topline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minWidth: 0 },
  label: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.base, lineHeight: Typography.lineHeight.base, fontFamily: Typography.fontFamily.medium },
  amount: { maxWidth: '45%', fontSize: Typography.fontSize.base, lineHeight: Typography.lineHeight.base, fontFamily: Typography.fontFamily.semiBold },
  meta: { marginTop: 2, fontSize: Typography.fontSize.xs, lineHeight: Typography.lineHeight.xs, fontFamily: Typography.fontFamily.regular },
  provenance: { display: 'none', flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs, minWidth: 0 },
  provenanceText: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.xs, lineHeight: Typography.lineHeight.xs, fontFamily: Typography.fontFamily.regular },
  emptyState: { marginTop: Spacing.md, paddingVertical: Spacing.xl },
});

export default CashflowCommitments;
