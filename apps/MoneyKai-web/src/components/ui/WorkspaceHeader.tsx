import React, { type ReactNode } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { withAlpha } from '@/utils/glassStyle';

type WorkspaceMetric = {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'danger' | 'warning';
};

type WorkspaceChip = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
};

type WorkspaceHeaderProps = {
  actions?: ReactNode;
  chips?: WorkspaceChip[];
  description: string;
  eyebrow?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  metrics?: WorkspaceMetric[];
  title: string;
  variant?: 'brand' | 'quiet';
};

export function WorkspaceHeader({
  actions,
  chips = [],
  description,
  eyebrow = 'MONEYKAI WORKSPACE',
  icon,
  metrics = [],
  title,
}: WorkspaceHeaderProps) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const isConstrainedDesktop = width < 1180;

  const resolveMetricColor = (tone: WorkspaceMetric['tone']) => {
    if (tone === 'positive') return colors.success;
    if (tone === 'danger') return colors.error;
    if (tone === 'warning') return colors.warning;
    return colors.textPrimary;
  };

  const resolveMetricTone = (metric: WorkspaceMetric) =>
    metric.value.trim().startsWith('-') ? 'danger' : metric.tone;

  return (
    <View
      style={{
        paddingVertical: isCompact ? Spacing.sm : Spacing.md,
        paddingBottom: Spacing.lg,
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderBottomWidth: 1,
        borderColor: 'transparent',
        borderBottomColor: colors.borderLight,
        gap: isCompact ? Spacing.md : Spacing.base,
        minWidth: 0,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          backgroundColor: colors.borderLight,
        }}
      />
      <View
        style={{
          flexDirection: isCompact ? 'column' : 'row',
          alignItems: isCompact ? 'stretch' : 'flex-start',
          gap: isCompact ? Spacing.md : Spacing.lg,
          flexWrap: isCompact ? 'nowrap' : 'wrap',
          minWidth: 0,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: Spacing.md,
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: isCompact || isConstrainedDesktop ? 'auto' : 520,
            minWidth: 0,
            maxWidth: '100%',
          }}
        >
          <View
            style={{
              width: isCompact ? 42 : 48,
              height: isCompact ? 42 : 48,
              borderRadius: BorderRadius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primaryBg,
              borderWidth: 0,
            }}
          >
            <MaterialCommunityIcons name={icon} size={isCompact ? 22 : 24} color={colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0, maxWidth: 900 }}>
            <Text numberOfLines={1} style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
              {eyebrow}
            </Text>
            <Text style={{ marginTop: 4, fontSize: isCompact ? Typography.fontSize['2xl'] : Typography.fontSize['3xl'], lineHeight: isCompact ? Typography.lineHeight['2xl'] : Typography.lineHeight['3xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              {title}
            </Text>
            <Text style={{ marginTop: 8, maxWidth: 780, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
              {description}
            </Text>
          </View>
        </View>
        {actions ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: isCompact ? 'flex-start' : 'flex-end',
              alignItems: 'stretch',
              alignSelf: isCompact || isConstrainedDesktop ? 'stretch' : 'flex-start',
              gap: Spacing.sm,
              flexGrow: isConstrainedDesktop ? 1 : 0,
              flexShrink: 1,
              flexBasis: isCompact ? 'auto' : isConstrainedDesktop ? '100%' : 360,
              maxWidth: '100%',
              minWidth: 0,
            }}
          >
            {actions}
          </View>
        ) : null}
      </View>

      {metrics.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 0,
            borderTopWidth: 1,
            borderTopColor: colors.borderLight,
            paddingTop: Spacing.sm,
          }}
        >
          {metrics.map((metric, index) => (
            <View
              key={metric.label}
              style={{
                flex: 1,
                minWidth: isCompact ? 136 : 160,
                paddingVertical: Spacing.sm,
                paddingHorizontal: isCompact ? 0 : index === 0 ? 0 : Spacing.md,
                borderRadius: 0,
                backgroundColor: 'transparent',
                borderWidth: 0,
                borderRightWidth: !isCompact && index < metrics.length - 1 ? 1 : 0,
                borderBottomWidth: isCompact && index < metrics.length - 1 ? 1 : 0,
                borderColor: colors.borderLight,
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{metric.label}</Text>
              <Text style={{ marginTop: 4, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: resolveMetricColor(resolveMetricTone(metric)) }}>
                {metric.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {chips.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {chips.map((chip) => (
            <View
              key={chip.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: Spacing.sm,
                paddingVertical: 7,
                borderRadius: BorderRadius.full,
                backgroundColor: withAlpha(colors.primary, isDark ? 0.1 : 0.05),
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <MaterialCommunityIcons name={chip.icon} size={14} color={colors.textSecondary} />
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
                {chip.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default WorkspaceHeader;
