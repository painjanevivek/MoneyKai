import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon as MaterialCommunityIcons } from '@/components/ui/AppIcon';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
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
  const isComplete = progress?.phase === 'complete';
  const isFailed = Boolean(failureMessage);
  const isRunning = !isComplete && !isFailed;

  return (
    <ModalSheet
      visible={visible}
      title={isFailed ? 'SMS check stopped' : isComplete ? 'SMS check finished' : 'Checking SMS inbox'}
      subtitle="Messages stay on this device. Transactions require your review."
      onClose={onClose}
      maxHeight={620}
    >
      <View style={{ gap: Spacing.md }}>
        {isRunning ? <ActivityIndicator accessibilityLabel="SMS check in progress" color={colors.primary} /> : null}
        <Text accessibilityLiveRegion="polite" style={{ color: isFailed ? colors.error : colors.textSecondary }}>
          {failureMessage ?? progress?.message ?? 'Waiting for consent and Android SMS permission. No inbox read has completed yet.'}
        </Text>
        {isFailed && onRetry ? <Button title="Try again" onPress={onRetry} /> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {[
            ['Scanned', progress?.scannedCount ?? 0, 'message-search-outline'],
            [progress?.phase === 'discovering_accounts' ? 'Accounts found' : 'Candidates', progress?.eligibleCount ?? 0, 'bank-check'],
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
