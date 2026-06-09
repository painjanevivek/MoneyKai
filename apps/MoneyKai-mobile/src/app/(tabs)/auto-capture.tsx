import React, { useMemo } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryById } from '@/constants/categories';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { CaptureSource, DraftTransaction } from '@/types/capture';

const confidenceLabel = (confidence: number) => {
  if (confidence >= 0.8) return 'High confidence';
  if (confidence >= 0.55) return 'Needs a quick check';
  return 'Needs category';
};

const sourceBadgeConfig: Record<CaptureSource, { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  notification: { label: 'Notification', icon: 'bell-badge-outline' },
  sms: { label: 'SMS', icon: 'message-processing-outline' },
  aa: { label: 'Bank Sync', icon: 'bank-transfer' },
  manual: { label: 'Manual', icon: 'pencil-outline' },
};

const SourceBadge = ({ source, sourceApp }: { source: CaptureSource; sourceApp?: string }) => {
  const { colors } = useTheme();
  const config = sourceBadgeConfig[source];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 5,
        borderRadius: BorderRadius.full,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderLight,
      }}
    >
      <MaterialCommunityIcons name={config.icon} size={13} color={colors.textSecondary} />
      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
        {sourceApp ? `${config.label} | ${sourceApp}` : config.label}
      </Text>
    </View>
  );
};

const buildExplanationText = (draft: DraftTransaction) => {
  const explanation = draft.parseExplanation;
  if (!explanation) return 'MoneyKai found a transaction amount and created a review draft.';

  return [
    draft.sourceApp ? `Source: ${draft.sourceApp}` : `Source: ${draft.captureSource}`,
    explanation.matchedAmount ? `Amount: ${explanation.matchedAmount}` : undefined,
    `Merchant: ${draft.description}`,
    explanation.matchedPaymentMethod ? `Method: ${explanation.matchedPaymentMethod}` : undefined,
    explanation.matchedDirectionTerms.length > 0 ? `Direction: ${explanation.matchedDirectionTerms.join(', ')}` : undefined,
    explanation.matchedCategoryRule ? `Category: ${explanation.matchedCategoryRule}` : undefined,
    `Confidence: ${Math.round(draft.confidence * 100)}%`,
    explanation.dedupeReference ? `Reference: ${explanation.dedupeReference}` : undefined,
    draft.parseReason ? `Reason: ${draft.parseReason}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
};

const DraftCard = ({ draft }: { draft: DraftTransaction }) => {
  const { colors } = useTheme();
  const confirmDraft = useCaptureStore((state) => state.confirmDraft);
  const ignoreDraft = useCaptureStore((state) => state.ignoreDraft);
  const categories = draft.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectedCategory = draft.category ? getCategoryById(draft.category) : undefined;

  const handleConfirm = (category: string) => {
    const confirmed = confirmDraft(draft.id, category);
    if (confirmed) {
      Alert.alert('Transaction added', 'MoneyKai added this draft to your transaction history.');
    }
  };

  const handleWhyCaptured = () => {
    Alert.alert('Why captured?', buildExplanationText(draft));
  };

  return (
    <Card variant="outlined" borderRadius="md" style={{ marginBottom: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: BorderRadius.sm,
            backgroundColor: selectedCategory?.colorLight ?? colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <MaterialCommunityIcons
            name={(selectedCategory?.icon ?? 'receipt-text-outline') as any}
            size={22}
            color={selectedCategory?.color ?? colors.textSecondary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SourceBadge source={draft.captureSource} sourceApp={draft.sourceApp} />
          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            {draft.description}
          </Text>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
            {draft.type === 'expense' ? '-' : '+'}
            {formatCurrency(draft.amount)} | {draft.payment_method.toUpperCase()} | {draft.transaction_date}
          </Text>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary, marginTop: 4 }}>
            {confidenceLabel(draft.confidence)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md }}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            activeOpacity={0.85}
            onPress={() => handleConfirm(category.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              borderRadius: BorderRadius.full,
              borderWidth: 1,
              borderColor: draft.category === category.id ? category.color : colors.border,
              backgroundColor: draft.category === category.id ? category.colorLight : colors.surface,
            }}
          >
            <MaterialCommunityIcons name={category.icon as any} size={15} color={category.color} />
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
        {draft.category ? (
          <Button
            title="Confirm Suggested"
            icon="check"
            onPress={() => handleConfirm(draft.category as string)}
            style={{ flex: 1 }}
          />
        ) : null}
        <Button
          title="Ignore"
          icon="close"
          variant="outline"
          onPress={() => ignoreDraft(draft.id)}
          style={{ flex: 1 }}
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleWhyCaptured}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: Spacing.sm,
          alignSelf: 'flex-start',
        }}
      >
        <MaterialCommunityIcons name="information-outline" size={16} color={colors.textSecondary} />
        <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
          Why captured?
        </Text>
      </TouchableOpacity>
    </Card>
  );
};

export default function AutoCaptureScreen() {
  const { colors } = useTheme();
  const drafts = useCaptureStore((state) => state.drafts);
  const signals = useCaptureStore((state) => state.signals);
  const merchantRules = useCaptureStore((state) => state.merchantRules);
  const pendingDrafts = useMemo(() => drafts.filter((draft) => draft.status === 'pending'), [drafts]);
  const recentSignals = useMemo(() => signals.slice(0, 5), [signals]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.base, paddingVertical: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
          Auto Capture
        </Text>
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
          Review transaction drafts before they affect your budget.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
          <Card variant="outlined" borderRadius="md" style={{ flex: 1 }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Pending</Text>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
              {pendingDrafts.length}
            </Text>
          </Card>
          <Card variant="outlined" borderRadius="md" style={{ flex: 1 }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Learned rules</Text>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
              {merchantRules.length}
            </Text>
          </Card>
        </View>

        {pendingDrafts.length === 0 ? (
          <EmptyState
            icon="check-circle-outline"
            title="No drafts to review"
            message="Captured transactions will appear here as reviewable drafts."
          />
        ) : (
          pendingDrafts.map((draft) => <DraftCard key={draft.id} draft={draft} />)
        )}

        {recentSignals.length > 0 ? (
          <View style={{ marginTop: Spacing.lg }}>
            <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
              Recent Signals
            </Text>
            {recentSignals.map((signal) => (
              <View
                key={signal.id}
                style={{
                  paddingVertical: Spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderLight,
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                  {signal.parsedMerchant ?? signal.sender ?? signal.sourceApp ?? signal.source}
                </Text>
                <View style={{ marginTop: 6 }}>
                  <SourceBadge source={signal.source} sourceApp={signal.sourceApp} />
                </View>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary, marginTop: 2 }}>
                  {signal.processingStatus} | {signal.parseReason ?? signal.ignoreReason ?? signal.receivedAt}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
