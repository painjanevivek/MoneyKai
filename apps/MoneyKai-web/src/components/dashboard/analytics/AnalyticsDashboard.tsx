import React from 'react';
import { Alert, Text, View, useWindowDimensions } from 'react-native';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Transaction } from '@/types/transaction';
import type { CashflowPlan } from '@/utils/cashflowPlan';
import { formatCurrency } from '@/utils/formatCurrency';
import { AnalyticsBreakdownCard } from './AnalyticsBreakdownCard';
import { AnalyticsCashflowPanel } from './AnalyticsCashflowPanel';
import { AnalyticsDashboardHeader } from './AnalyticsDashboardHeader';
import { AnalyticsKpiGrid, type AnalyticsKpi } from './AnalyticsKpiGrid';
import { MoneyRecordsWorkspace } from './MoneyRecordsWorkspace';
import { DashboardLayoutEditor } from './DashboardLayoutEditor';
import { DashboardMotionItem } from './DashboardMotionItem';
import type { DashboardSectionId } from './dashboardLayout';
import { rangeToDays, type AnalyticsRange } from './types';
import { useDashboardLayout } from './useDashboardLayout';
import { previousFinancePeriod, rollingFinancePeriod, summarizeTransactions } from '@/utils/financeCore';

interface Props {
  plan: CashflowPlan;
  transactions: Transaction[];
  periodEnd: Date;
  userId?: string;
  onAddTransaction: () => void;
  onAdjustBudget: () => void;
  onStartGoal: () => void;
  onOpenAiReview: () => void;
  onOpenReports: () => void;
  onViewTransactions: () => void;
  onUpdateTransactionCategory: (transactionIds: string[], categoryId: string) => void;
}

const percentageChange = (current: number, previous: number) => previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
const formatChange = (value: number) => `${value > 0 ? '+' : ''}${Math.round(value)}%`;
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

export function AnalyticsDashboard({ plan, transactions, periodEnd, userId, onAddTransaction, onAdjustBudget, onStartGoal, onOpenAiReview, onOpenReports, onViewTransactions, onUpdateTransactionCategory }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 1180;
  const [range, setRange] = React.useState<AnalyticsRange>('30d');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedKpi, setSelectedKpi] = React.useState<string | null>(null);
  const [layoutEditorVisible, setLayoutEditorVisible] = React.useState(false);
  const { order, moveSection, resetLayout, customized } = useDashboardLayout(userId);
  const days = rangeToDays(range);
  const periodEndMs = periodEnd.getTime();

  const { visibleTransactions, previousTransactions, current, previous } = React.useMemo(() => {
    const period = rollingFinancePeriod(new Date(periodEndMs), days);
    const type = selectedKpi === 'income' || selectedKpi === 'expense' ? selectedKpi : undefined;
    const currentSummary = summarizeTransactions(transactions, { period, query: searchQuery, type });
    const previousSummary = summarizeTransactions(transactions, { period: previousFinancePeriod(period), query: searchQuery, type });
    return { visibleTransactions: currentSummary.transactions, previousTransactions: previousSummary.transactions, current: currentSummary, previous: previousSummary };
  }, [days, periodEndMs, searchQuery, selectedKpi, transactions]);
  const currentNet = current.income - current.expense;
  const previousNet = previous.income - previous.expense;
  const kpis = React.useMemo<AnalyticsKpi[]>(() => [
    { id: 'income', label: 'Money in', value: formatCurrency(current.income), comparison: formatChange(percentageChange(current.income, previous.income)), trend: percentageChange(current.income, previous.income), footnote: 'Click to filter money records', icon: 'cash-plus', tone: 'positive' },
    { id: 'expense', label: 'Money out', value: formatCurrency(current.expense), comparison: formatChange(percentageChange(current.expense, previous.expense)), trend: -percentageChange(current.expense, previous.expense), footnote: 'Click to filter money records', icon: 'cash-minus', tone: current.expense > previous.expense ? 'negative' : 'positive' },
    { id: 'net', label: 'Net cashflow', value: `${currentNet < 0 ? '-' : '+'}${formatCurrency(Math.abs(currentNet))}`, comparison: formatChange(percentageChange(currentNet, previousNet)), trend: currentNet - previousNet, footnote: 'Income minus reviewed expense', icon: 'chart-timeline-variant-shimmer', tone: currentNet < 0 ? 'negative' : 'positive' },
    { id: 'records', label: 'Reviewed records', value: String(visibleTransactions.length), comparison: formatChange(percentageChange(visibleTransactions.length, previousTransactions.length)), trend: visibleTransactions.length - previousTransactions.length, footnote: 'Verified records in this range', icon: 'account-check-outline', tone: 'neutral' },
  ], [current.expense, current.income, currentNet, previous.expense, previous.income, previousNet, previousTransactions.length, visibleTransactions.length]);

  const categories = React.useMemo(() => current.categories.map((item) => ({ category: item.category, total: item.total, count: item.count, percentage: item.percentage })), [current.categories]);

  const exportRecords = React.useCallback((records: Transaction[], scope: 'period' | 'selected') => {
    if (typeof document === 'undefined' || typeof URL === 'undefined') {
      Alert.alert('Export is available on web', 'Open MoneyKai in a desktop browser to download CSV records.');
      return;
    }
    if (records.length === 0) {
      Alert.alert('Nothing to export', scope === 'selected' ? 'Select at least one money record first.' : 'There are no records in this dashboard period.');
      return;
    }
    const header = ['Date', 'Type', 'Description', 'Category', 'Payment method', 'Source', 'Amount'];
    const rows = records.map((transaction) => [transaction.transaction_date, transaction.type, transaction.description, transaction.category, transaction.payment_method, transaction.captureSource ?? 'manual', transaction.amount]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moneykai-dashboard-${scope}-${range}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [range]);

  const toggleKpi = (id: string) => setSelectedKpi((currentId) => currentId === id ? null : id);

  const sectionContent: Record<DashboardSectionId, React.ReactNode> = {
    overview: <AnalyticsKpiGrid items={kpis} selectedId={selectedKpi} onSelect={toggleKpi} />,
    cashflow: <AnalyticsCashflowPanel plan={plan} onViewTransactions={onViewTransactions} />,
    breakdown: <AnalyticsBreakdownCard categories={categories} onViewDetails={onOpenReports} />,
    signals: (
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: Spacing.md }}>
        <SignalCard label="Safe to spend" value={formatCurrency(plan.metrics.safeToSpend)} detail={plan.hasBudget ? 'After reviewed expenses and recurring commitments' : 'Set a monthly budget to activate this guardrail'} tone={plan.hasBudget ? colors.success : colors.warning} />
        <SignalCard label="Upcoming commitments" value={formatCurrency(plan.metrics.upcomingCommitments)} detail={plan.isForecastAvailable ? 'Recurring expenses you confirmed' : 'Forecasting is available for the current month'} tone={colors.warning} />
        <SignalCard label="Forecast month end" value={`${plan.metrics.forecastNetFlow < 0 ? '-' : '+'}${formatCurrency(Math.abs(plan.metrics.forecastNetFlow))}`} detail="Projected net flow after known recurring activity" tone={plan.metrics.forecastNetFlow < 0 ? colors.error : colors.success} />
      </View>
    ),
    records: <MoneyRecordsWorkspace transactions={visibleTransactions} onViewAll={onViewTransactions} onExport={exportRecords} onOpenAiReview={onOpenAiReview} onOpenReports={onOpenReports} onUpdateCategory={onUpdateTransactionCategory} />,
  };

  const sectionStyle = (section: DashboardSectionId) => {
    if (!wide || section === 'overview' || section === 'signals' || section === 'records') {
      return { width: '100%' as const, minWidth: 0 };
    }
    if (section === 'cashflow') return { flexGrow: 2, flexBasis: '62%' as const, minWidth: 620 };
    return { flexGrow: 1, flexBasis: '30%' as const, minWidth: 320 };
  };

  return (
    <View style={{ gap: Spacing.lg }}>
      <AnalyticsDashboardHeader range={range} searchQuery={searchQuery} onChangeRange={setRange} onChangeSearch={setSearchQuery} onExport={() => exportRecords(visibleTransactions, 'period')} onAddTransaction={onAddTransaction} onOpenAiReview={onOpenAiReview} onCustomizeLayout={() => setLayoutEditorVisible(true)} layoutCustomized={customized} secondaryActions={[{ label: 'Adjust budget', icon: 'tune-variant', onPress: onAdjustBudget }, { label: 'Start a goal', icon: 'target', onPress: onStartGoal }, { label: 'Open reports', icon: 'file-chart-outline', onPress: onOpenReports }]} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: Spacing.md }}>
        {order.map((section, index) => (
          <DashboardMotionItem key={section} orderKey={index} style={sectionStyle(section)}>
            {sectionContent[section]}
          </DashboardMotionItem>
        ))}
      </View>
      <DashboardLayoutEditor visible={layoutEditorVisible} order={order} customized={customized} onMove={moveSection} onReset={resetLayout} onClose={() => setLayoutEditorVisible(false)} />
    </View>
  );
}

function SignalCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  const { colors } = useTheme();
  return <View style={{ flex: 1, minWidth: 220, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.card }}><Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>{label.toUpperCase()}</Text><Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: tone }}>{value}</Text><Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>{detail}</Text></View>;
}
