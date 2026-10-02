import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { MoneyToolRow } from '@/components/ui/MoneyToolScreen';
import { PressableScale } from '@/components/ui/PressableScale';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, TransactionDirectionColor, Typography } from '@/constants/theme';
import { getDraftCategoryOptions } from '@/services/captureCategoryRules';
import { redactSensitiveSmsText } from '@/services/smsPrivacy';
import { PAYMENT_METHODS } from '@/constants/categories';
import type { DraftTransaction } from '@/types/capture';
import { draftCategoryLabel, draftDateLabel, draftSourceLabel } from '@/utils/draftReview';

type Props = {
  draft: DraftTransaction;
  currencySymbol: string;
  category?: string;
  error?: string;
  hasBudget: boolean;
  onCategoryChange: (category: string) => void;
  onConfirm: () => void;
  onIgnore: () => void;
  onBudget: () => void;
  onClose: () => void;
};

export function DraftReviewSheet({ draft, currencySymbol, category, error, hasBudget, onCategoryChange, onConfirm, onIgnore, onBudget, onClose }: Props) {
  const { colors } = useTheme();
  const pending = draft.status === 'pending';
  const credit = draft.type === 'income';
  const categoryOptions = getDraftCategoryOptions(draft);
  const categoryReady = categoryOptions.some((option) => option.id === category);
  const snippet = draft.parseExplanation?.safeSnippet;
  const paymentLabel = PAYMENT_METHODS.find((item) => item.id === draft.payment_method)?.name ?? draft.payment_method;
  const directionColor = credit ? TransactionDirectionColor.credit : TransactionDirectionColor.debit;

  return <ModalSheet visible expandable title={pending ? 'Review draft' : 'Draft details'} subtitle={pending ? 'Check every detail before saving' : draft.status === 'confirmed' ? draft.automaticallyRecorded ? 'Auto-added · editable in Transactions' : 'Confirmed draft' : 'Ignored · not added from this draft'} onClose={onClose} maxHeight={760} footer={pending ? <View style={styles.actions}>
    {error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.textPrimary }]}>{error}</Text> : null}
    <Text style={[styles.body, { color: colors.textSecondary }]}>Confirm only if the amount, date and direction are correct.</Text>
    <Button title="Confirm transaction" disabled={!categoryReady || !hasBudget} onPress={onConfirm} />
    <Button title="Ignore draft" variant="ghost" onPress={onIgnore} />
  </View> : <Button title="Done" onPress={onClose} />}>
    <View style={[styles.amountBox, { backgroundColor: colors.surfaceElevated }]}>
      <View style={styles.directionRow}><AppIcon name={credit ? 'arrow-down-left' : 'arrow-up-right'} size={20} color={directionColor} /><Text style={[styles.label, { color: directionColor }]}>{credit ? 'Credit' : 'Debit'}</Text></View>
      <Text style={[styles.amount, { color: colors.textPrimary }]}>{credit ? '+' : '−'}{currencySymbol}{draft.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
    </View>
    <Text selectable style={[styles.description, { color: colors.textPrimary }]}>{draft.description}</Text>
    <MoneyToolRow label="Transaction date" value={draftDateLabel(draft.transaction_date)} />
    <MoneyToolRow label="Payment method" value={paymentLabel} />
    <MoneyToolRow label="Source" value={draftSourceLabel(draft.captureSource)} />
    {draft.captureAccountLabel || draft.captureBankLabel ? <MoneyToolRow label="Account" value={draft.captureAccountLabel ?? draft.captureBankLabel ?? ''} /> : null}
    {pending ? <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.heading, { color: colors.textPrimary }]}>Choose a category</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{draft.suggestedCategory ? `Parser suggestion: ${draftCategoryLabel(draft.suggestedCategory)}. Choose the category yourself.` : 'Select the category that matches this transaction.'}</Text>
      <View style={styles.categories}>{categoryOptions.map((option) => {
        const active = category === option.id;
        return <PressableScale key={option.id} accessibilityRole="radio" accessibilityLabel={option.name} accessibilityState={{ checked: active }} onPress={() => onCategoryChange(option.id)} style={[styles.category, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}>
          <AppIcon name={option.icon} size={16} color={active ? colors.textInverse : colors.textSecondary} />
          <Text style={[styles.categoryText, { color: active ? colors.textInverse : colors.textPrimary }]}>{option.name}</Text>
          {active ? <AppIcon name="check" size={14} color={colors.textInverse} /> : null}
        </PressableScale>;
      })}</View>
      {!hasBudget ? <View style={styles.budgetNotice}><Text style={[styles.body, { color: colors.textSecondary }]}>Set a monthly budget to confirm. Your draft stays pending.</Text><Button title="Set monthly budget" variant="outline" onPress={onBudget} /></View> : null}
    </View> : <MoneyToolRow label="Category" value={draft.category ? draftCategoryLabel(draft.category) : 'Not categorized'} />}
    {snippet ? <Disclosure title="Source preview" summary="Sensitive details are masked"><Text selectable style={[styles.source, { color: colors.textSecondary, backgroundColor: colors.surfaceElevated }]}>{redactSensitiveSmsText(snippet)}</Text></Disclosure> : null}
    {pending ? <Text style={[styles.helper, { color: colors.textSecondary }]}>If a detail is wrong, ignore this draft and add the transaction manually. Nothing is saved until you confirm.</Text> : null}
  </ModalSheet>;
}

const styles = StyleSheet.create({
  actions: { gap: Spacing.sm },
  amountBox: { borderRadius: BorderRadius.md, padding: Spacing.lg },
  directionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md },
  amount: { fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize['4xl'], fontVariant: ['tabular-nums'], marginTop: Spacing.sm },
  description: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.lg, lineHeight: Typography.lineHeight.lg, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  section: { marginTop: Spacing.xl },
  heading: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, marginBottom: Spacing.sm },
  body: { fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  category: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, minHeight: 44, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, maxWidth: '100%' },
  categoryText: { flexShrink: 1, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm },
  budgetNotice: { gap: Spacing.sm, marginTop: Spacing.lg },
  error: { fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm },
  source: { fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.md, borderRadius: BorderRadius.sm, padding: Spacing.md },
  helper: { fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, marginTop: Spacing.lg },
});
