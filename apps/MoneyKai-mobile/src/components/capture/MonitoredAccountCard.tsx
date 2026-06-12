import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatMonitoredAccountLabel } from '@/services/captureAccountIdentifier';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import type { MonitoredAccount } from '@/types/capture';

interface MonitoredAccountCardProps {
  account: MonitoredAccount;
  onApprove?: (account: MonitoredAccount) => void;
  onDecline?: (account: MonitoredAccount) => void;
  onPause?: (account: MonitoredAccount) => void;
  onResume?: (account: MonitoredAccount) => void;
  onShowMessage?: (account: MonitoredAccount) => void;
}

const statusCopy: Record<MonitoredAccount['status'], { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  pending: { label: 'Needs approval', icon: 'clock-outline' },
  approved: { label: 'Monitoring', icon: 'check-circle-outline' },
  paused: { label: 'Unselected', icon: 'pause-circle-outline' },
  declined: { label: 'Declined', icon: 'close-circle-outline' },
};

export const MonitoredAccountCard = ({
  account,
  onApprove,
  onDecline,
  onPause,
  onResume,
  onShowMessage,
}: MonitoredAccountCardProps) => {
  const { colors } = useTheme();
  const accountLabel = formatMonitoredAccountLabel(account);
  const status = statusCopy[account.status];

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: colors.borderLight,
        ...Shadows.sm,
        shadowColor: colors.shadowColor,
      }}
    >
      <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: BorderRadius.sm,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <MaterialCommunityIcons name="bank-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            {accountLabel}
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 18, marginTop: 2 }}>
            {account.sampleCount} SMS sample{account.sampleCount === 1 ? '' : 's'} found
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
            <MaterialCommunityIcons name={status.icon} size={14} color={colors.textTertiary} />
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>{status.label}</Text>
          </View>
        </View>
        {account.discoverySample ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Show message used to identify ${accountLabel}`}
            activeOpacity={0.82}
            onPress={() => onShowMessage?.(account)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <MaterialCommunityIcons name="message-text-outline" size={17} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
        {account.status === 'pending' ? (
          <>
            <TouchableOpacity
              activeOpacity={0.84}
              onPress={() => onDecline?.(account)}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: BorderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.emergencyBg,
                borderWidth: 1,
                borderColor: `${colors.emergency}44`,
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.emergency }}>
                Decline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.84}
              onPress={() => onApprove?.(account)}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: BorderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                Monitor
              </Text>
            </TouchableOpacity>
          </>
        ) : account.status === 'approved' ? (
          <TouchableOpacity
            activeOpacity={0.84}
            onPress={() => onPause?.(account)}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: BorderRadius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
              Stop monitoring
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.84}
            onPress={() => onResume?.(account)}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: BorderRadius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
              Resume monitoring
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
