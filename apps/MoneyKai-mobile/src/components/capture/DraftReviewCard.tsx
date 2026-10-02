import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, TransactionDirectionColor, Typography } from '@/constants/theme';
import type { DraftTransaction } from '@/types/capture';
import { draftCategoryLabel, draftDateLabel, draftSourceLabel } from '@/utils/draftReview';

export function DraftReviewCard({ draft, currencySymbol, onOpen }: { draft: DraftTransaction; currencySymbol: string; onOpen: (draft: DraftTransaction) => void }) {
  const { colors } = useTheme();
  const credit = draft.type === 'income';
  const directionColor = credit ? TransactionDirectionColor.credit : TransactionDirectionColor.debit;
  const amount = `${credit ? '+' : '−'}${currencySymbol}${draft.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const pending = draft.status === 'pending';
  const statusLabel = pending ? 'Needs review' : draft.status === 'confirmed' ? draft.automaticallyRecorded ? 'Auto-added · editable in Transactions' : 'Confirmed' : 'Ignored';

  return <PressableScale accessibilityRole="button" accessibilityLabel={`${draft.description}, ${credit ? 'Credit' : 'Debit'}, ${amount}, ${statusLabel}`} accessibilityHint={pending ? 'Check transaction details and choose a category before confirming' : 'View reviewed draft details'} onPress={() => onOpen(draft)} pressedScale={0.99} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
    <View style={styles.topRow}>
      <View style={[styles.direction, { backgroundColor: colors.surfaceElevated }]}><AppIcon name={credit ? 'arrow-down-left' : 'arrow-up-right'} size={20} color={directionColor} /></View>
      <View style={styles.description}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{draft.description || 'Captured transaction'}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{draftSourceLabel(draft.captureSource)} · {draftDateLabel(draft.transaction_date)}</Text>
      </View>
    </View>
    <View style={styles.amountRow}>
      <Text style={[styles.directionLabel, { color: directionColor }]}>{credit ? 'Credit' : 'Debit'}</Text>
      <Text style={[styles.amount, { color: colors.textPrimary }]}>{amount}</Text>
    </View>
    {draft.captureAccountLabel || draft.captureBankLabel ? <Text numberOfLines={1} style={[styles.account, { color: colors.textSecondary }]}>{draft.captureAccountLabel ?? draft.captureBankLabel}</Text> : null}
    <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
      <View style={styles.description}>
        <Text style={[styles.category, { color: colors.textPrimary }]}>{!pending && !draft.category ? 'Not categorized' : draftCategoryLabel(draft.category)}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{statusLabel}</Text>
      </View>
      <Text style={[styles.action, { color: colors.textPrimary }]}>{pending ? 'Review' : 'Details'}</Text>
      <AppIcon name="chevron-right" size={18} color={colors.textPrimary} />
    </View>
  </PressableScale>;
}

const styles = StyleSheet.create({
  card: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  direction: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  description: { flex: 1, minWidth: 0 },
  title: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, lineHeight: Typography.lineHeight.md },
  meta: { fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, marginTop: Spacing.xs },
  amountRow: { marginTop: Spacing.lg, gap: Spacing.xs },
  directionLabel: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm },
  amount: { fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize['3xl'], fontVariant: ['tabular-nums'] },
  account: { fontSize: Typography.fontSize.sm, marginTop: Spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, marginTop: Spacing.lg, paddingTop: Spacing.md, minHeight: 48 },
  category: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm },
  action: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm },
});
