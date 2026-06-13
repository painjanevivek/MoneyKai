import React from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { FinancialDocument, ParsedStatementReview } from '@/types/financialDocument';
import { formatCurrency } from '@/utils/formatCurrency';

interface ParsedStatementReviewSheetProps {
  document?: FinancialDocument;
  review?: ParsedStatementReview;
  visible: boolean;
  importingHoldings?: boolean;
  onClose: () => void;
  onImportHoldings?: () => void;
}

export const ParsedStatementReviewSheet: React.FC<ParsedStatementReviewSheetProps> = ({
  document,
  review,
  visible,
  importingHoldings = false,
  onClose,
  onImportHoldings,
}) => {
  const { colors } = useTheme();
  const hasHoldingRows = Boolean(review?.rows.some((row) => row.rowType === 'holding'));

  return (
    <ModalSheet
      visible={visible}
      title="Parsed statement"
      subtitle={document?.filename ?? 'Review extracted rows before importing in a later phase.'}
      onClose={onClose}
      footer={
        <View style={{ gap: Spacing.sm }}>
          {hasHoldingRows && onImportHoldings ? (
            <Button title="Import Holdings" icon="database-import-outline" loading={importingHoldings} onPress={onImportHoldings} />
          ) : null}
          <Button title="Close" onPress={onClose} variant="outline" />
        </View>
      }
    >
      <View style={{ gap: Spacing.md }}>
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
