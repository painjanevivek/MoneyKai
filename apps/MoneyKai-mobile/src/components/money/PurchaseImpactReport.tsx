import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { Disclosure } from '@/components/ui/Disclosure';
import { MoneyToolRow, toolStyles } from '@/components/ui/MoneyToolScreen';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { getCategoryById } from '@/constants/categories';
import { useTheme } from '@/hooks/useTheme';
import type { PurchaseImpact } from '@/utils/purchaseImpact';
import { formatToolMoney as money } from '@/utils/purchaseTools';

export function PurchaseImpactReport({ result, mode }: { result: PurchaseImpact; mode: 'buy' | 'reserve' }) {
  const { colors } = useTheme();
  const cuts = result.categories.filter(row => row.reductionPaise > 0);
  const body = [toolStyles.body, { color: colors.textSecondary }];
  const heading = [toolStyles.title, styles.heading, { color: colors.textPrimary }];
  return <View style={toolStyles.section} testID="purchase-impact-report">
    <Text accessibilityRole="header" style={heading}>Month impact</Text>
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
      <Text style={body}>{mode === 'buy' ? 'After buying' : 'After setting money aside'}</Text>
      <Text style={[styles.total, { color: colors.textPrimary }]}>{money(result.afterPaise)}</Text>
      <Text style={body}>{result.shortfallPaise > 0
        ? `• ${money(result.shortfallPaise)} over budget. Try a smaller amount or wait.`
        : `• Left for ${result.days} days, including today.\n• Fits your recorded budget; upcoming needs may change this.`}</Text>
      <MoneyToolRow label="Daily spending room before" value={money(result.dailyBeforePaise)} />
      <MoneyToolRow label="Daily spending room after" value={money(result.dailyAfterPaise)} />
      <MoneyToolRow label="Less room per day" value={money(result.dailyReductionPaise)} />
      {result.budgetImpactPercent !== null ? <MoneyToolRow label="Share of available budget" value={`${result.budgetImpactPercent.toFixed(1)}%`} /> : null}
    </View>
    <Disclosure title="History & flexible spending">
    <Text accessibilityRole="header" style={heading}>Your last two months</Text>
    <Text style={body}>{result.months.map(month => month.label).join(' · ')}</Text>
    <Text style={body}>{result.recordCount} recorded expenses · {result.representedMonths} of 2 months represented.</Text>
    <Text style={[body, styles.note]}>{result.representedMonths < 2
      ? '• Limited history for a two-month comparison.\n• Missing expenses are unknown, not zero.\n• Review earlier expenses for a stronger estimate.'
      : '• Averages use recorded expenses only.\n• Check missing expenses before relying on them.'}</Text>
    {result.recordCount > 0 ? <>
      <MoneyToolRow label="Variable spending at recorded pace, for days left" value={money(result.projectedVariablePaise)} />
      <Text style={[body, styles.note]}>{result.variablePaceGapPaise > 0
        ? `• At this pace, you could be ${money(result.variablePaceGapPaise)} short.\n• Upcoming needs may increase the gap.`
        : '• Your recorded spending pace fits.\n• Upcoming costs may change this.'}</Text>
    </> : null}
    <Text accessibilityRole="header" style={heading}>Optional places to make room</Text>
    <Text style={body}>{`• Make room for ${money(result.amountPaise)} in flexible categories only.\n• Suggested trims are capped at 40% of recorded pace.\n• Never cut essentials.`}</Text>
    {cuts.map(row => <View key={row.id} style={[styles.card, styles.note, { borderColor: colors.borderLight }]}>
      <Text accessibilityRole="header" style={[toolStyles.title, { color: colors.textPrimary }]}>{getCategoryById(row.id)?.name ?? row.id}</Text>
      <MoneyToolRow label="Monthly recorded average" value={money(row.monthlyAveragePaise)} />
      <MoneyToolRow label="Recorded pace for days left" value={money(row.remainingPacePaise)} />
      <MoneyToolRow label="Optional amount to trim" value={money(row.reductionPaise)} />
      <MoneyToolRow label="Target after trimming" value={money(row.remainingPacePaise - row.reductionPaise)} />
    </View>)}
    <Text style={[body, styles.note]}>{cuts.length === 0 ? '• No supported trim in your selected categories.' : `• These changes could offset ${money(result.recoveredPaise)}.`}{result.unrecoveredPaise > 0
      ? `\n• ${money(result.unrecoveredPaise)} still needs room. Try a smaller amount or wait.`
      : '\n• These reductions still need to happen.'}</Text>
    <Disclosure title="Protected spending">
      <Text style={body}>{'• Rent, bills, medical, education and transport.\n• Unknown-purpose payments.\n• Food and shopping essentials—trim only optional spending.'}</Text>
    </Disclosure>
    </Disclosure>
    <Disclosure title="Category breakdown and calculation">
      {result.categories.map(row => <MoneyToolRow key={row.id} label={`${getCategoryById(row.id)?.name ?? row.id} · monthly recorded average`} value={money(row.monthlyAveragePaise)} />)}
      <MoneyToolRow label="Budget before this decision" value={money(result.beforePaise + result.commitmentsPaise)} />
      {result.commitmentsPaise > 0 ? <MoneyToolRow label="Unrecorded bills kept aside" value={money(result.commitmentsPaise)} /> : null}
      <MoneyToolRow label={mode === 'buy' ? 'Purchase amount' : 'Amount set aside'} value={money(result.amountPaise)} />
      <Text style={[body, styles.note]}>{'• Budget minus this amount, divided by days left.\n• Daily room is rounded down to a paise.\n• History uses recorded calendar months only.\n• No future income or unrecorded costs are assumed.'}</Text>
    </Disclosure>
  </View>;
}
const styles = StyleSheet.create({
  card: { padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1 },
  total: { fontSize: Typography.fontSize['3xl'], fontFamily: Typography.fontFamily.bold, marginVertical: Spacing.md },
  heading: { marginTop: Spacing.xl },
  note: { marginVertical: Spacing.md },
});
