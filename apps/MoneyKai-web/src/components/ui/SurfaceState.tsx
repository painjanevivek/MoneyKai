import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View, type ViewStyle } from 'react-native';
import { BorderRadius, Spacing, Typography } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

export type WorkspaceSurfaceStateKind =
  | 'ready'
  | 'loading'
  | 'empty'
  | 'partial'
  | 'restricted'
  | 'unavailable'
  | 'error';

export type SurfaceStateProps = Readonly<{
  kind: WorkspaceSurfaceStateKind;
  headline: string;
  detail?: string;
  sourceLabel?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: ViewStyle;
  testID?: string;
}>;

const STATE_TREATMENTS: Record<
  WorkspaceSurfaceStateKind,
  { icon: keyof typeof MaterialCommunityIcons.glyphMap; tone: 'primary' | 'warning' | 'error' | 'info' }
> = {
  ready: { icon: 'check-circle-outline', tone: 'primary' },
  loading: { icon: 'progress-clock', tone: 'info' },
  empty: { icon: 'inbox-outline', tone: 'primary' },
  partial: { icon: 'information-outline', tone: 'warning' },
  restricted: { icon: 'lock-outline', tone: 'warning' },
  unavailable: { icon: 'cloud-off-outline', tone: 'warning' },
  error: { icon: 'alert-circle-outline', tone: 'error' },
};

export function SurfaceState({
  kind,
  headline,
  detail,
  sourceLabel,
  primaryAction,
  secondaryAction,
  icon,
  style,
  testID,
}: SurfaceStateProps) {
  const { colors } = useTheme();
  const treatment = STATE_TREATMENTS[kind];
  const toneColor = {
    primary: colors.primary,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
  }[treatment.tone];
  const isLiveUpdate = kind === 'loading' || kind === 'partial' || kind === 'unavailable' || kind === 'error';

  return (
    <View
      testID={testID}
      accessibilityLiveRegion={isLiveUpdate ? 'polite' : 'none'}
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          borderRadius: BorderRadius.lg,
          borderWidth: 1,
          gap: Spacing.md,
          padding: Spacing.lg,
        },
        style,
      ]}
    >
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.sm }}>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.borderLight,
            borderRadius: BorderRadius.full,
            borderWidth: 1,
            height: 32,
            justifyContent: 'center',
            width: 32,
          }}
        >
          <MaterialCommunityIcons color={toneColor} name={icon ?? treatment.icon} size={18} />
        </View>
        <Text
          style={{
            color: colors.textPrimary,
            flex: 1,
            fontFamily: Typography.fontFamily.semiBold,
            fontSize: Typography.fontSize.md,
          }}
        >
          {headline}
        </Text>
      </View>

      {detail ? (
        <Text
          style={{
            color: colors.textSecondary,
            fontFamily: Typography.fontFamily.regular,
            fontSize: Typography.fontSize.base,
            lineHeight: Typography.lineHeight.base,
          }}
        >
          {detail}
        </Text>
      ) : null}

      {sourceLabel ? (
        <Text
          style={{
            color: colors.textTertiary,
            fontFamily: Typography.fontFamily.medium,
            fontSize: Typography.fontSize.sm,
          }}
        >
          Source: {sourceLabel}
        </Text>
      ) : null}

      {primaryAction || secondaryAction ? (
        <View style={{ alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {primaryAction}
          {secondaryAction}
        </View>
      ) : null}
    </View>
  );
}

export default SurfaceState;
