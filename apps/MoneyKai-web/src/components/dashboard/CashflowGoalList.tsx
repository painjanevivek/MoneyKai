import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/dateUtils';
import type { GoalSnapshot } from '../../utils/cashflowPlan';
import { withAlpha } from '../../utils/glassStyle';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

interface CashflowGoalListProps {
  goals: GoalSnapshot[];
  onViewAll: () => void;
}

export function CashflowGoalList({ goals, onViewAll }: CashflowGoalListProps) {
  const { colors } = useTheme();
  const visibleGoals = [...goals]
    .sort((left, right) => left.endDate.localeCompare(right.endDate) || left.label.localeCompare(right.label) || left.id.localeCompare(right.id))
    .slice(0, 3);

  return (
    <View testID="savings-goals" style={styles.root}>
      <Card variant="glass" style={styles.card}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>Savings goals</Text>
          <Button title="View all" variant="ghost" size="sm" onPress={onViewAll} />
        </View>

        {visibleGoals.length === 0 ? (
          <EmptyState
            icon="target"
            title="No active goals"
            message="Start a goal to keep progress visible."
            action={<Button title="Start a goal" icon="plus" size="sm" onPress={onViewAll} />}
            style={styles.emptyState}
          />
        ) : (
          <View accessibilityRole="list" style={styles.list}>
            {visibleGoals.map((goal, index) => {
              const progress = Math.min(100, Math.max(0, goal.progressPercent));
              return (
                <View
                  key={goal.id}
                  accessibilityRole="summary"
                  accessibilityLabel={`${goal.label}, ${Math.round(progress)} percent complete, ${formatCurrency(goal.currentValue)} of ${formatCurrency(goal.targetValue)}, ends ${formatDate(goal.endDate, 'dd MMM yyyy')}.`}
                  style={[
                    styles.goalRow,
                    index > 0 ? { borderTopWidth: 1, borderTopColor: colors.borderLight } : null,
                  ]}
                >
                  <View style={[styles.goalIcon, { backgroundColor: withAlpha(colors.primary, 0.12), borderColor: withAlpha(colors.primary, 0.24) }]}>
                    <MaterialCommunityIcons name="target" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.goalBody}>
                    <View style={styles.goalTopline}>
                      <Text style={[styles.goalName, { color: colors.textPrimary }]} numberOfLines={1}>{goal.label}</Text>
                      <Text style={[styles.percent, { color: colors.primary }]}>{Math.round(progress)}%</Text>
                    </View>
                    <Text style={[styles.goalValues, { color: colors.textSecondary }]} numberOfLines={1}>
                      {formatCurrency(goal.currentValue)} of {formatCurrency(goal.targetValue)}
                    </Text>
                    <View
                      accessibilityRole="progressbar"
                      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
                      style={[styles.track, { backgroundColor: colors.borderLight }]}
                    >
                      <View style={[styles.fill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
                    </View>
                    <Text style={[styles.endDate, { color: colors.textTertiary }]}>Ends {formatDate(goal.endDate, 'dd MMM yyyy')}</Text>
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
  header: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing.sm },
  title: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.md, lineHeight: Typography.lineHeight.md, fontFamily: Typography.fontFamily.semiBold },
  list: { minWidth: 0 },
  goalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.md, minWidth: 0 },
  goalIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  goalBody: { flex: 1, minWidth: 0 },
  goalTopline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  goalName: { flex: 1, minWidth: 0, fontSize: Typography.fontSize.base, lineHeight: Typography.lineHeight.base, fontFamily: Typography.fontFamily.medium },
  percent: { fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, fontFamily: Typography.fontFamily.semiBold },
  goalValues: { marginTop: Spacing.xs, fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, fontFamily: Typography.fontFamily.regular },
  track: { height: 6, borderRadius: BorderRadius.full, overflow: 'hidden', marginTop: Spacing.sm },
  fill: { height: '100%', borderRadius: BorderRadius.full },
  endDate: { marginTop: Spacing.xs, fontSize: Typography.fontSize.xs, lineHeight: Typography.lineHeight.xs, fontFamily: Typography.fontFamily.regular },
  emptyState: { paddingVertical: Spacing.xl },
});

export default CashflowGoalList;
