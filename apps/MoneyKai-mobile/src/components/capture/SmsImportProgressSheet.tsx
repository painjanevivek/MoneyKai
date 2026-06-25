import React from 'react';
import { Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { ProgressFlowCard } from '@/components/ui/ProgressFlowCard';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { buildSmsImportProgressFlow } from '@/services/progressIllusion';
import type { SmsImportProgress } from '@/types/smsImport';

interface SmsImportProgressSheetProps {
  visible: boolean;
  progress?: SmsImportProgress;
  failureMessage?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const SmsImportProgressSheet = ({ visible, progress, failureMessage, onClose, onRetry }: SmsImportProgressSheetProps) => {
  const { colors } = useTheme();
  const flow = buildSmsImportProgressFlow(progress, failureMessage);
  const isComplete = flow.status === 'success';
  const isFailed = flow.status === 'failed';

  return (
    <ModalSheet
      visible={visible}
      title={flow.title}
      subtitle={isComplete ? 'Review drafts before they affect your budget.' : isFailed ? 'Nothing is added until the import succeeds.' : 'MoneyKai is working in safe review-only stages.'}
      onClose={onClose}
      maxHeight={620}
    >
      <View style={{ gap: Spacing.md }}>
        <ProgressFlowCard
          flow={flow}
          onRetry={isFailed ? onRetry : undefined}
          onBackground={!isComplete && !isFailed ? onClose : undefined}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {[
            ['Scanned', progress?.scannedCount ?? 0, 'message-search-outline'],
            ['Eligible', progress?.eligibleCount ?? 0, 'bank-check'],
            ['Drafts', progress?.draftedCount ?? 0, 'receipt-text-outline'],
            ['Duplicates', progress?.duplicateCount ?? 0, 'content-duplicate'],
          ].map(([label, value, icon]) => (
            <View
              key={label as string}
              style={{
                width: '48%',
                minHeight: 72,
                borderRadius: BorderRadius.sm,
                borderWidth: 1,
                borderColor: colors.borderLight,
                backgroundColor: colors.surface,
                padding: Spacing.md,
                gap: 4,
              }}
            >
              <MaterialCommunityIcons name={icon as any} size={18} color={colors.textSecondary} />
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{label}</Text>
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
                {value}
              </Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
          Parsed SMS become review drafts. MoneyKai will not add them to transactions until you approve a category.
        </Text>
      </View>
    </ModalSheet>
  );
};
