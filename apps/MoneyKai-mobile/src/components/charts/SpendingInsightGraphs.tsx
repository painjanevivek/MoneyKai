import React from 'react';
import { Text, View, type DimensionValue } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { PAYMENT_METHODS } from '../../constants/categories';
import { BorderRadius, Spacing, Typography } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Transaction } from '../../types/transaction';

type SpendingInsightGraphsProps = {
  transactions: Transaction[];
  monthlyAllowance: number;
  totalIncome: number;
  totalSpent: number;
};

type BarRow = {
  id: string;
  label: string;
  value: number;
  color: string;
  icon?: string;
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const normalizeMethod = (method: string) => {
  const value = method.toLowerCase();

  if (value.includes('upi')) return 'upi';
  if (value.includes('card') || value.includes('credit') || value.includes('debit')) return 'card';
  if (value.includes('bank') || value.includes('neft') || value.includes('imps') || value.includes('rtgs')) return 'bank';
  if (value.includes('wallet')) return 'wallet';
  if (value.includes('cash')) return 'cash';

  return method.trim().toLowerCase() || 'other';
};

const formatPercent = (value: number, total: number) => (total > 0 ? `${Math.round((value / total) * 100)}%` : '0%');

const GraphHeader = ({ title, subtitle }: { title: string; subtitle: string }) => {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
        {title}
      </Text>
      <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, lineHeight: 16, color: colors.textSecondary }}>
        {subtitle}
      </Text>
    </View>
  );
};

const EmptyGraph = ({ message }: { message: string }) => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        minHeight: 104,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.surface,
        padding: Spacing.md,
      }}
    >
      <MaterialCommunityIcons name="chart-box-outline" size={22} color={colors.textTertiary} />
      <Text style={{ marginTop: 6, fontSize: Typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  );
};

const HorizontalBarRows = ({ rows, total }: { rows: BarRow[]; total: number }) => {
  const { colors } = useTheme();
  const maxValue = Math.max(...rows.map((row) => row.value), 1);

  return (
    <View style={{ gap: Spacing.md }}>
      {rows.map((row) => {
        const width = `${Math.max(5, (row.value / maxValue) * 100)}%` as DimensionValue;

        return (
          <View key={row.id} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              {row.icon ? (
                <MaterialCommunityIcons name={row.icon as any} size={16} color={row.color} />
              ) : (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.color }} />
              )}
              <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                {row.label}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
                {formatCurrency(row.value)} · {formatPercent(row.value, total)}
              </Text>
            </View>
            <View style={{ height: 8, borderRadius: 8, backgroundColor: colors.borderLight, overflow: 'hidden' }}>
              <View style={{ height: '100%', width, borderRadius: 8, backgroundColor: row.color }} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

export const SpendingInsightGraphs: React.FC<SpendingInsightGraphsProps> = ({
  transactions,
  monthlyAllowance,
  totalIncome,
  totalSpent,
}) => {
  const { colors } = useTheme();

  const dailyRows = React.useMemo(() => {
    const totals = DAY_LABELS.map((label, index) => ({
      id: label,
      label,
      value: 0,
      color: index >= 5 ? colors.accent : colors.primary,
    }));

    transactions.forEach((transaction) => {
      if (transaction.type !== 'expense') return;
      const day = new Date(transaction.transaction_date).getDay();
      const mondayIndex = day === 0 ? 6 : day - 1;
      totals[mondayIndex].value += transaction.amount;
    });

    return totals;
  }, [colors.accent, colors.primary, transactions]);

  const paymentRows = React.useMemo(() => {
    const methodMap = new Map<string, BarRow>();
    const methodDefs = new Map(PAYMENT_METHODS.map((method) => [method.id, method]));
    const palette = [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5, colors.chart6];

    transactions.forEach((transaction) => {
      if (transaction.type !== 'expense') return;
      const id = normalizeMethod(transaction.payment_method);
      const methodDef = methodDefs.get(id as any);
      const existing = methodMap.get(id);

      if (existing) {
        existing.value += transaction.amount;
        return;
      }

      methodMap.set(id, {
        id,
        label: methodDef?.name ?? id.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
        value: transaction.amount,
        color: palette[methodMap.size % palette.length],
        icon: methodDef?.icon,
      });
    });

    return [...methodMap.values()].sort((a, b) => b.value - a.value).slice(0, 5);
  }, [colors, transactions]);

  const cashFlowRows = React.useMemo(() => {
    const available = Math.max(0, monthlyAllowance - totalSpent);
    return [
      { id: 'income', label: 'Income', value: totalIncome, color: colors.primary, icon: 'arrow-down-circle-outline' },
      { id: 'spent', label: 'Spent', value: totalSpent, color: colors.emergency, icon: 'arrow-up-circle-outline' },
      { id: 'available', label: 'Budget left', value: available, color: colors.chart2, icon: 'wallet-outline' },
    ].filter((row) => row.value > 0);
  }, [colors.chart2, colors.emergency, colors.primary, monthlyAllowance, totalIncome, totalSpent]);

  const dailyTotal = dailyRows.reduce((sum, row) => sum + row.value, 0);
  const paymentTotal = paymentRows.reduce((sum, row) => sum + row.value, 0);
  const peakDay = dailyRows.reduce((peak, row) => (row.value > peak.value ? row : peak), dailyRows[0]);
  const topMethod = paymentRows[0];

  return (
    <>
      <Card variant="outlined" borderRadius="lg" style={{ backgroundColor: colors.card, borderColor: colors.borderLight }}>
        <GraphHeader
          title="Daily Rhythm"
          subtitle={peakDay.value > 0 ? `${peakDay.label} is the heaviest spending day this month.` : 'See which days usually run hot.'}
        />
        {dailyTotal > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, minHeight: 132 }}>
            {dailyRows.map((row) => {
              const height = Math.max(12, (row.value / Math.max(peakDay.value, 1)) * 104);
              return (
                <View key={row.id} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                  <View style={{ height: 108, justifyContent: 'flex-end', width: '100%' }}>
                    <View
                      style={{
                        height,
                        borderRadius: BorderRadius.full,
                        backgroundColor: row.color,
                        opacity: row.value > 0 ? 1 : 0.24,
                      }}
                    />
                  </View>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{row.label}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <EmptyGraph message="No spending in the selected month yet." />
        )}
      </Card>

      <Card variant="outlined" borderRadius="lg" style={{ backgroundColor: colors.card, borderColor: colors.borderLight }}>
        <GraphHeader
          title="How You Paid"
          subtitle={topMethod ? `${topMethod.label} carries the biggest share of spending.` : 'Payment mix appears after expenses are added.'}
        />
        {paymentRows.length > 0 ? <HorizontalBarRows rows={paymentRows} total={paymentTotal} /> : <EmptyGraph message="No payment method data yet." />}
      </Card>

      <Card variant="outlined" borderRadius="lg" style={{ backgroundColor: colors.card, borderColor: colors.borderLight }}>
        <GraphHeader title="Cash Flow Snapshot" subtitle="Income, spending, and budget left in one quick read." />
        {cashFlowRows.length > 0 ? (
          <HorizontalBarRows rows={cashFlowRows} total={Math.max(totalIncome, monthlyAllowance, totalSpent)} />
        ) : (
          <EmptyGraph message="Set a budget or add transactions to see cash flow." />
        )}
      </Card>
    </>
  );
};

export default SpendingInsightGraphs;
