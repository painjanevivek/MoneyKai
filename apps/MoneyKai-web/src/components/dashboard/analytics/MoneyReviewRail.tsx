import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { MoneyRecordsBreakdownItem, MoneyRecordsSummary } from './moneyRecords.types';

interface Props {
  periodSummary: MoneyRecordsSummary;
  selectionSummary: MoneyRecordsSummary;
  selectedCount: number;
  onClearSelection: () => void;
  onExportSelected: () => void;
  onEditCategory: () => void;
  onOpenAiReview: () => void;
  onOpenReports: () => void;
}

export function MoneyReviewRail({ periodSummary, selectionSummary, selectedCount, onClearSelection, onExportSelected, onEditCategory, onOpenAiReview, onOpenReports }: Props) {
  const { colors } = useTheme();
  const selected = selectedCount > 0;
  const summary = selected ? selectionSummary : periodSummary;
  const [showAllCategories, setShowAllCategories] = React.useState(false);
  const categories = showAllCategories ? summary.categories : summary.categories.slice(0, 3);

  return (
    <View accessibilityRole="summary" accessibilityLabel={selected ? `Reviewing ${selectedCount} selected records` : 'Current period money review'} style={{ borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: selected ? colors.primary : colors.borderLight, backgroundColor: colors.card, padding: Spacing.lg, gap: Spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}><MaterialCommunityIcons name={selected ? 'checkbox-multiple-marked-outline' : 'clipboard-text-search-outline'} size={20} color={selected ? colors.primary : colors.textSecondary} /><Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{selected ? 'Selection review' : 'Period review'}</Text></View>
          <Text accessibilityLiveRegion="polite" style={{ marginTop: 5, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>{selected ? `${selectedCount} visible record${selectedCount === 1 ? '' : 's'} selected` : `${periodSummary.count} reviewed record${periodSummary.count === 1 ? '' : 's'} in this dashboard range`}</Text>
        </View>
        {selected ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Clear selected records" onPress={onClearSelection} style={{ minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.full, backgroundColor: colors.surface }}><MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} /></TouchableOpacity> : null}
      </View>

      {summary.count === 0 ? <EmptyReviewState /> : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            <SummaryMetric label="Money in" value={`+${formatCurrency(summary.income)}`} tone={colors.success} />
            <SummaryMetric label="Money out" value={`-${formatCurrency(summary.expense)}`} tone={colors.textPrimary} />
            <SummaryMetric label="Net movement" value={`${summary.net < 0 ? '-' : '+'}${formatCurrency(Math.abs(summary.net))}`} tone={summary.net < 0 ? colors.error : colors.success} wide />
          </View>

          {summary.categories.length > 0 ? (
            <View style={{ borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: Spacing.md, gap: Spacing.sm }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>CATEGORY MIX</Text>
              {categories.map((category) => <BreakdownRow key={category.id} item={category} />)}
              {summary.categories.length > 3 ? <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: showAllCategories }} onPress={() => setShowAllCategories((current) => !current)} style={{ minHeight: 40, alignSelf: 'flex-start', justifyContent: 'center' }}><Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>{showAllCategories ? 'Show less' : `Show ${summary.categories.length - 3} more`}</Text></TouchableOpacity> : null}
            </View>
          ) : null}

          {!selected && summary.largestExpense ? (
            <View style={{ borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: Spacing.md }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>LARGEST EXPENSE</Text>
              <Text numberOfLines={1} style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>{summary.largestExpense.description}</Text>
              <Text style={{ marginTop: 3, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{formatCurrency(summary.largestExpense.amount)} · {summary.largestExpense.transaction_date}</Text>
            </View>
          ) : null}
        </>
      )}

      <View style={{ gap: Spacing.sm }}>
        {selected ? (
          <>
            <RailButton label="Edit category" icon="shape-outline" onPress={onEditCategory} disabled={selectionSummary.hasMixedTypes} primary />
            {selectionSummary.hasMixedTypes ? <Text style={{ fontSize: 11, lineHeight: 16, color: colors.textTertiary }}>Choose only income or only expense records to edit their category together.</Text> : null}
            <RailButton label="Export selected" icon="file-download-outline" onPress={onExportSelected} />
            <RailButton label="Open AI Review" icon="brain" onPress={onOpenAiReview} />
          </>
        ) : (
          <>
            <RailButton label="Open reports" icon="file-chart-outline" onPress={onOpenReports} primary />
            <RailButton label="Open AI Review" icon="brain" onPress={onOpenAiReview} />
          </>
        )}
      </View>
    </View>
  );
}

function EmptyReviewState() {
  const { colors } = useTheme();
  return <View style={{ paddingVertical: Spacing.xl, alignItems: 'center' }}><MaterialCommunityIcons name="text-box-plus-outline" size={30} color={colors.textTertiary} /><Text style={{ marginTop: Spacing.sm, textAlign: 'center', fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>No period activity yet</Text><Text style={{ marginTop: 4, textAlign: 'center', fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>Reviewed income and expenses will create a useful review summary here.</Text></View>;
}

function SummaryMetric({ label, value, tone, wide = false }: { label: string; value: string; tone: string; wide?: boolean }) {
  const { colors } = useTheme();
  return <View style={{ flexGrow: 1, flexBasis: wide ? '100%' : '44%', minWidth: 105, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surface }}><Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.medium, color: colors.textTertiary }}>{label.toUpperCase()}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 5, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: tone }}>{value}</Text></View>;
}

function BreakdownRow({ item }: { item: MoneyRecordsBreakdownItem }) {
  const { colors } = useTheme();
  return <View><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm }}><Text numberOfLines={1} style={{ flex: 1, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{item.label}</Text><Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{formatCurrency(item.total)}</Text></View><View style={{ height: 5, marginTop: 6, borderRadius: BorderRadius.full, backgroundColor: colors.surface, overflow: 'hidden' }}><View style={{ height: '100%', width: `${Math.max(3, item.percentage)}%`, borderRadius: BorderRadius.full, backgroundColor: colors.primary }} /></View></View>;
}

function RailButton({ label, icon, onPress, primary = false, disabled = false }: { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; onPress: () => void; primary?: boolean; disabled?: boolean }) {
  const { colors } = useTheme();
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={{ minHeight: 46, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: primary ? colors.primary : colors.border, backgroundColor: primary ? colors.primary : colors.card, opacity: disabled ? 0.5 : 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}><MaterialCommunityIcons name={icon} size={18} color={primary ? colors.textInverse : colors.textSecondary} /><Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: primary ? colors.textInverse : colors.textPrimary }}>{label}</Text></View><MaterialCommunityIcons name="arrow-right" size={17} color={primary ? colors.textInverse : colors.textTertiary} /></TouchableOpacity>;
}
