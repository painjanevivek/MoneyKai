import React from 'react';
import { Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { AiDocumentSummaryResponse } from '@/features/ai/types';
import { formatCurrency } from '@/utils/formatCurrency';

interface FinancialDocumentAiSummaryPanelProps {
  summary?: AiDocumentSummaryResponse;
  loading?: boolean;
  disabled?: boolean;
  onGenerate: () => void;
}

export const FinancialDocumentAiSummaryPanel: React.FC<FinancialDocumentAiSummaryPanelProps> = ({
  summary,
  loading = false,
  disabled = false,
  onGenerate,
}) => {
  const { colors } = useTheme();
  const detectedFields = summary?.detectedFields;
  const metrics = [
    { label: 'Period', value: detectedFields?.period ?? null },
    {
      label: 'Credits',
      value: typeof detectedFields?.totalCredits === 'number' ? formatCurrency(detectedFields.totalCredits) : null,
    },
    {
      label: 'Debits',
      value: typeof detectedFields?.totalDebits === 'number' ? formatCurrency(detectedFields.totalDebits) : null,
    },
    {
      label: 'Closing',
      value: typeof detectedFields?.closingBalance === 'number' ? formatCurrency(detectedFields.closingBalance) : null,
    },
  ].filter((item) => item.value);

  return (
    <View
      style={{
        gap: Spacing.md,
        padding: Spacing.base,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: colors.accentLight,
      }}
    >
      <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: BorderRadius.md,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="brain" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            AI document review
          </Text>
          <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
            {summary
              ? 'Generated from MoneyKai document context. Review before importing or acting on it.'
              : 'Generate an on-demand AI summary from the parsed statement context to spot balances, periods, and gaps faster.'}
          </Text>
        </View>
      </View>

      {summary ? (
        <View style={{ gap: Spacing.md }}>
          <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textPrimary }}>{summary.summary}</Text>

          {metrics.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {metrics.map((metric) => (
                <View
                  key={metric.label}
                  style={{
                    minWidth: '47%',
                    gap: 2,
                    paddingVertical: Spacing.sm,
                    paddingHorizontal: Spacing.md,
                    borderRadius: BorderRadius.md,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                  }}
                >
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>{metric.label}</Text>
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {metric.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {summary.warnings.length > 0 ? (
            <View style={{ gap: Spacing.xs }}>
              {summary.warnings.map((warning) => (
                <View key={warning} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.textSecondary} />
                  <Text style={{ flex: 1, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                    {warning}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
            Model: {summary.model}
          </Text>
        </View>
      ) : null}

      <Button
        title={summary ? 'Refresh AI Summary' : 'Generate AI Summary'}
        icon={summary ? 'refresh' : 'brain'}
        onPress={onGenerate}
        loading={loading}
        disabled={disabled}
        size="sm"
        variant="outline"
      />
    </View>
  );
};
