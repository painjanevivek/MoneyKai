import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { getDaysUntilReset } from '../../utils/dateUtils';
import { Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface StatCardProps {
  icon: string;
  iconBg: string;
  label: string;
  value: string;
  subtitle?: string;
  subtitleColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconBg, label, value, subtitle, subtitleColor }) => {
  const { colors } = useTheme();
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      ...Shadows.sm,
      shadowColor: colors.shadowColor,
      borderWidth: 1,
      borderColor: colors.borderLight,
    }}>
      <View style={{
        width: 36,
        height: 36,
        borderRadius: BorderRadius.sm,
        backgroundColor: iconBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
      }}>
        <MaterialCommunityIcons name={icon as any} size={18} color={colors.primary} />
      </View>
      <Text style={{
        fontSize: Typography.fontSize.xs,
        fontFamily: Typography.fontFamily.medium,
        color: colors.textSecondary,
        marginBottom: 2,
      }}>{label}</Text>
      <Text style={{
        fontSize: Typography.fontSize.lg,
        fontFamily: Typography.fontFamily.bold,
        color: colors.textPrimary,
      }}>{value}</Text>
      {subtitle && (
        <Text style={{
          fontSize: Typography.fontSize.xs,
          fontFamily: Typography.fontFamily.regular,
          color: subtitleColor || colors.textTertiary,
          marginTop: 2,
        }}>{subtitle}</Text>
      )}
    </View>
  );
};

export const BalanceCards: React.FC = () => {
  const { colors } = useTheme();
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const { settings } = useBudgetStore();
  const allowance = settings.monthly_allowance;
  const remaining = allowance - totalSpent;
  const dailyAvg = totalSpent / Math.max(1, new Date().getDate());
  const daysLeft = getDaysUntilReset(settings.reset_day);
  const estimatedSavings = remaining - (dailyAvg * daysLeft);
  const spentPercent = allowance > 0 ? ((totalSpent / allowance) * 100).toFixed(1) : '0';
  const remainingPercent = allowance > 0 ? ((remaining / allowance) * 100).toFixed(1) : '0';

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm }}>
        <StatCard
          icon="wallet-outline"
          iconBg={colors.primaryBg}
          label="Monthly Allowance"
          value={formatCurrency(allowance)}
          subtitle={`Resets in ${daysLeft} days`}
        />
        <StatCard
          icon="arrow-up-circle-outline"
          iconBg={colors.borderLight}
          label="Total Spent"
          value={formatCurrency(totalSpent)}
          subtitle={`${spentPercent}% of allowance`}
          subtitleColor={Number(spentPercent) > 80 ? colors.emergency : colors.textTertiary}
        />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        <StatCard
          icon="cash-multiple"
          iconBg={colors.primaryBg}
          label="Amount Left"
          value={formatCurrency(Math.max(0, remaining))}
          subtitle={`${remainingPercent}% of allowance`}
          subtitleColor={remaining < 0 ? colors.emergency : colors.primaryLight}
        />
        <StatCard
          icon="chart-timeline-variant"
          iconBg={colors.borderLight}
          label="Daily Average"
          value={formatCurrency(Math.round(dailyAvg))}
        />
        <StatCard
          icon="piggy-bank-outline"
          iconBg={colors.borderLight}
          label="Savings Estimate"
          value={formatCurrency(Math.max(0, Math.round(estimatedSavings)))}
          subtitle="if you continue like this"
        />
      </View>
    </View>
  );
};

export default BalanceCards;
