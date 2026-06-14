import React from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { FinancialDocumentAiSummaryPanel } from './FinancialDocumentAiSummaryPanel';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { AiDocumentSummaryResponse } from '@/features/ai/types';
import type { FinancialDocument, ParsedStatementReview } from '@/types/financialDocument';
import { formatCurrency } from '@/utils/formatCurrency';

interface ParsedStatementReviewSheetProps {
  document?: FinancialDocument;
  review?: ParsedStatementReview;
  aiSummary?: AiDocumentSummaryResponse;
  visible: boolean;
  summarizingAiSummary?: boolean;
  importingHoldings?: boolean;
  reconcilingTransactions?: boolean;
  approvingReview?: boolean;
  ignoringReview?: boolean;
  importingReview?: boolean;
  onClose: () => void;
  onImportHoldings?: () => void;
  onReconcileTransactions?: () => void;
  onApproveReview?: () => void;
  onIgnoreReview?: () => void;
  onImportReview?: () => void;
  onGenerateAiSummary?: () => void;
}

export const ParsedStatementReviewSheet: React.FC<ParsedStatementReviewSheetProps> = ({
  document,
  review,
  aiSummary,
  visible,
  summarizingAiSummary = false,
  importingHoldings = false,
  reconcilingTransactions = false,
  approvingReview = false,
  ignoringReview = false,
  importingReview = false,
  onClose,
  onImportHoldings,
  onReconcileTransactions,
  onApproveReview,
  onIgnoreReview,
  onImportReview,
  onGenerateAiSummary,
}) => {
  const { colors } = useTheme();
  const hasHoldingRows = Boolean(review?.rows.some((row) => row.rowType === 'holding'));
  const hasTransactionRows = Boolean(review?.rows.some((row) => row.rowType === 'transaction'));
  const isPendingReview = review?.status === 'pending_review';

  return (
    <ModalSheet
      visible={visible}
      title="Parsed statement"
      subtitle={document?.filename ?? 'Review extracted rows before importing them into MoneyKai.'}
      onClose={onClose}
      footer={
        <View style={{ gap: Spacing.sm }}>
          {isPendingReview && onImportReview ? (
            <Button title="Import Review Rows" icon="database-import-outline" loading={importingReview} onPress={onImportReview} />
          ) : null}
          {isPendingReview && hasHoldingRows && onImportHoldings ? (
            <Button title="Import Holdings" icon="database-import-outline" loading={importingHoldings} onPress={onImportHoldings} />
          ) : null}
          {isPendingReview && hasTransactionRows && onReconcileTransactions ? (
            <Button
              title="Reconcile Transactions"
              icon="source-merge"
              loading={reconcilingTransactions}
              onPress={onReconcileTransactions}
              variant="outline"
            />
          ) : null}
          {isPendingReview && onApproveReview ? (
            <Button title="Approve Review" icon="check-circle-outline" loading={approvingReview} onPress={onApproveReview} variant="outline" />
          ) : null}
          {isPendingReview && onIgnoreReview ? (
            <Button title="Ignore Review" icon="close-circle-outline" loading={ignoringReview} onPress={onIgnoreReview} variant="outline" />
          ) : null}
          <Button title="Close" onPress={onClose} variant="outline" />
        </View>
      }
    >
      <View style={{ gap: Spacing.md }}>
        {review ? (
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
            Review status: {review.status.replace(/_/g, ' ')}
          </Text>
        ) : null}
        {onGenerateAiSummary ? (
          <FinancialDocumentAiSummaryPanel
            summary={aiSummary}
            loading={summarizingAiSummary}
            disabled={!document}
            onGenerate={onGenerateAiSummary}
          />
        ) : null}
        {!review || review.rows.length === 0 ? (
          <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
            No reviewable rows were extracted from this document.
          </Text>
        ) : (
          review.rows.map((row) => (
            <View key={row.id} style={{ paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: 2 }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {row.description}
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
                    {row.date ?? 'No date'} | {(row.confidence * 100).toFixed(0)}% confidence
                  </Text>
                </View>
                {typeof row.amount === 'number' ? (
                  <Text style={{ fontSize: Typography.fontSize.sm, color: row.amount >= 0 ? colors.success : colors.error }}>
                    {formatCurrency(row.amount)}
                  </Text>
                ) : null}
              </View>
              <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textTertiary }}>
                {row.sourceText}
              </Text>
            </View>
          ))
        )}
      </View>
    </ModalSheet>
  );
};
