import React from 'react';
import { Alert, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { reconciliationApi } from '@/services/reconciliationApi';
import { useReconciliationStore } from '@/stores/useReconciliationStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import type { ReconciliationCandidate } from '@/types/reconciliation';
import { formatCurrency } from '@/utils/formatCurrency';

const statusCopy: Record<ReconciliationCandidate['status'], string> = {
  new_transaction: 'Ready to create',
  enrich_existing: 'Can enrich existing',
  duplicate: 'Likely duplicate',
  conflict: 'Needs review',
};

export const ReconciliationReviewCard: React.FC = () => {
  const { colors } = useTheme();
  const reviews = useReconciliationStore((state) => state.reviews);
  const setReviews = useReconciliationStore((state) => state.setReviews);
  const upsertReview = useReconciliationStore((state) => state.upsertReview);
  const upsertBackendTransaction = useTransactionStore((state) => state.upsertBackendTransaction);
  const [busy, setBusy] = React.useState<'refresh' | 'approve' | 'ignore' | null>(null);
  const [busyReviewId, setBusyReviewId] = React.useState<string | undefined>();

  const pendingReviews = React.useMemo(
    () => reviews.filter((review) => review.reviewStatus === 'pending').slice(0, 5),
    [reviews]
  );

  const hydrateReviews = React.useCallback(async () => {
    try {
      setReviews(await reconciliationApi.listReviews('pending'));
    } catch (error) {
      Alert.alert('Reconciliation unavailable', error instanceof Error ? error.message : 'Could not load pending reviews.');
    }
  }, [setReviews]);

  const refreshReviews = React.useCallback(async () => {
    setBusy('refresh');
    try {
      await hydrateReviews();
    } finally {
      setBusy(null);
    }
  }, [hydrateReviews]);

  React.useEffect(() => {
    void hydrateReviews();
  }, [hydrateReviews]);

  const approveReview = async (review: ReconciliationCandidate) => {
    setBusy('approve');
    setBusyReviewId(review.id);
    try {
      const response = await reconciliationApi.approveReview(review.id);
      upsertReview(response.item);
      if (response.createdTransaction) {
        upsertBackendTransaction(response.createdTransaction);
      }
    } catch (error) {
      Alert.alert('Approval failed', error instanceof Error ? error.message : 'Could not approve this review.');
    } finally {
      setBusy(null);
      setBusyReviewId(undefined);
    }
  };

  const ignoreReview = async (review: ReconciliationCandidate) => {
    setBusy('ignore');
    setBusyReviewId(review.id);
    try {
      upsertReview(await reconciliationApi.ignoreReview(review.id));
    } catch (error) {
      Alert.alert('Ignore failed', error instanceof Error ? error.message : 'Could not ignore this review.');
    } finally {
      setBusy(null);
      setBusyReviewId(undefined);
    }
  };

  return (
    <Card style={{ marginBottom: Spacing.md, gap: Spacing.md }} variant="outlined">
      <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: BorderRadius.sm,
            backgroundColor: colors.primaryBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="source-merge" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: Spacing.xs }}>
          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Reconciliation review
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
            Approve new statement transactions, enrich matches, or ignore likely duplicates.
          </Text>
        </View>
      </View>

      <Button
        title="Refresh Reviews"
        icon="refresh"
        variant="outline"
        loading={busy === 'refresh'}
        onPress={refreshReviews}
      />

      {pendingReviews.length === 0 ? (
        <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
          No pending reconciliation reviews.
        </Text>
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {pendingReviews.map((review) => (
            <View key={review.id} style={{ paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight, gap: Spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {review.event.description}
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
                    {statusCopy[review.status]} | {(review.confidence * 100).toFixed(0)}% | {review.event.date}
                  </Text>
                </View>
                {typeof review.event.amount === 'number' ? (
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {formatCurrency(review.event.amount)}
                  </Text>
                ) : null}
              </View>
              {review.reasons.length > 0 ? (
                <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                  {review.reasons.slice(0, 2).join(' | ')}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                <Button
                  title="Approve"
                  icon="check-circle-outline"
                  size="sm"
                  loading={busy === 'approve' && busyReviewId === review.id}
                  disabled={busy !== null}
                  onPress={() => approveReview(review)}
                  style={{ flexGrow: 1 }}
                />
                <Button
                  title="Ignore"
                  icon="close-circle-outline"
                  size="sm"
                  variant="outline"
                  loading={busy === 'ignore' && busyReviewId === review.id}
                  disabled={busy !== null}
                  onPress={() => ignoreReview(review)}
                  style={{ flexGrow: 1 }}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
};
