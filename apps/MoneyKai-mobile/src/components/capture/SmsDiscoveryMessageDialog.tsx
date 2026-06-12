import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import type { MonitoredAccount } from '@/types/capture';

interface SmsDiscoveryMessageDialogProps {
  account?: MonitoredAccount;
  visible: boolean;
  onClose: () => void;
}

export const SmsDiscoveryMessageDialog = ({ account, visible, onClose }: SmsDiscoveryMessageDialogProps) => {
  const { colors } = useTheme();
  const sample = account?.discoverySample;

  return (
    <ModalSheet
      visible={visible}
      title="Discovery message"
      subtitle="Sensitive identifiers are redacted and kept on this device."
      onClose={onClose}
      maxHeight={460}
    >
      <View style={{ gap: Spacing.md }}>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
          <MaterialCommunityIcons name="bank-outline" size={18} color={colors.textSecondary} />
          <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
            {account?.bankLabel ?? 'Bank account'}
          </Text>
        </View>
        <View
          style={{
            borderRadius: BorderRadius.sm,
            borderWidth: 1,
            borderColor: colors.borderLight,
            backgroundColor: colors.surface,
            padding: Spacing.md,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
            {sample?.redactedBody ?? 'No message preview is available for this account.'}
          </Text>
        </View>
        {sample?.sender || sample?.receivedAt ? (
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
            {[sample.sender, sample.receivedAt ? new Date(sample.receivedAt).toLocaleString() : undefined]
              .filter(Boolean)
              .join(' | ')}
          </Text>
        ) : null}
      </View>
    </ModalSheet>
  );
};
