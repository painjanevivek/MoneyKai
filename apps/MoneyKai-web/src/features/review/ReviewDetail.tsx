import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { ReviewAction, ReviewActionRequest, ReviewItem } from '@/types/review';

interface Props {
  item: ReviewItem | null;
  busy: boolean;
  onAction: (item: ReviewItem, payload: Omit<ReviewActionRequest, 'expectedRevision'>) => Promise<unknown>;
}

export function ReviewDetail({ item, busy, onAction }: Props) {
  const { colors } = useTheme();
  const [editing, setEditing] = React.useState(false);
  const [amount, setAmount] = React.useState(item?.subject.amount == null ? '' : String(item.subject.amount));
  const [date, setDate] = React.useState(item?.subject.date.slice(0, 10) ?? '');
  const [description, setDescription] = React.useState(item?.subject.description ?? '');

  if (!item) {
    return <Card style={{ minHeight: 360, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="cursor-default-click-outline" size={32} color={colors.textTertiary} /><Text style={{ marginTop: Spacing.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>Select a review item</Text><Text style={{ marginTop: 4, textAlign: 'center', color: colors.textSecondary }}>Evidence and safe actions will appear here.</Text></Card>;
  }

  const can = (action: ReviewAction) => item.allowedActions.includes(action);
  const parsedAmount = Number(amount);
  const amountError = !Number.isFinite(parsedAmount) || parsedAmount < 0 ? 'Enter a valid non-negative amount.' : undefined;
  const dateError = /^\d{4}-\d{2}-\d{2}$/.test(date) ? undefined : 'Use YYYY-MM-DD.';
  const submitEdit = () => onAction(item, { action: 'edit', edits: { amount: parsedAmount, date, description } });

  return (
    <Card style={{ gap: Spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md }}><View style={{ flex: 1, minWidth: 0 }}><Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>{item.reasonCode.replaceAll('_', ' ').toUpperCase()}</Text><Text accessibilityRole="header" style={{ marginTop: 4, fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>{item.title}</Text><Text style={{ marginTop: 6, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>{item.summary}</Text></View><View style={{ paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: colors.surfaceElevated }}><Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>{item.status.toUpperCase()}</Text></View></View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>{item.evidence.map((evidence) => <View key={`${evidence.code}-${evidence.value}`} style={{ flexGrow: 1, flexBasis: 150, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: colors.surfaceElevated }}><Text style={{ fontSize: 11, color: colors.textTertiary }}>{evidence.label.toUpperCase()}</Text><Text style={{ marginTop: 4, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{evidence.value}</Text></View>)}</View>

      <View style={{ padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.borderLight }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}><MaterialCommunityIcons name="source-branch" size={18} color={colors.primary} /><Text style={{ fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>Why this is here</Text></View><Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, lineHeight: 21, color: colors.textSecondary }}>MoneyKai received this record from {item.provenance.source.replace('_', ' ')} and kept it outside canonical totals until you decide. The confidence score is evidence, not an automatic decision.</Text></View>

      {editing ? <View style={{ borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: Spacing.lg }}><Text style={{ marginBottom: Spacing.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>Edit review evidence</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}><Input label="Amount" value={amount} onChangeText={setAmount} error={amount ? amountError : undefined} keyboardType="decimal-pad" inputMode="decimal" style={{ flex: 1, minWidth: 180 }} /><Input label="Date" value={date} onChangeText={setDate} error={date ? dateError : undefined} placeholder="YYYY-MM-DD" style={{ flex: 1, minWidth: 180 }} /></View><Input label="Description" value={description} onChangeText={setDescription} maxLength={240} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}><Button title="Save evidence" onPress={() => void submitEdit()} loading={busy} disabled={!amount || Boolean(amountError) || Boolean(dateError) || !description.trim()} /><Button title="Cancel" onPress={() => setEditing(false)} variant="ghost" disabled={busy} /></View></View> : null}

      {!editing && item.allowedActions.length > 0 ? <View style={{ borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: Spacing.lg, gap: Spacing.sm }}><Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>Actions are revision-checked and retry-safe. Approve is the only action that can update canonical transaction data.</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}><Button title="Approve" icon="check" onPress={() => void onAction(item, { action: 'approve' })} loading={busy} disabled={!can('approve')} /><Button title="Edit" icon="pencil-outline" onPress={() => setEditing(true)} variant="outline" disabled={busy || !can('edit')} /><Button title="Defer 24h" icon="clock-outline" onPress={() => void onAction(item, { action: 'defer', deferredUntil: new Date(Date.now() + 86_400_000).toISOString() })} variant="outline" disabled={busy || !can('defer')} /><Button title="Ignore" icon="eye-off-outline" onPress={() => void onAction(item, { action: 'ignore' })} variant="ghost" disabled={busy || !can('ignore')} /></View></View> : null}
    </Card>
  );
}
