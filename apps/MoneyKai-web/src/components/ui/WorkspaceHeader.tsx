import React, { type ReactNode } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { strongGlassBackdropStyle, withAlpha } from '@/utils/glassStyle';

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
  const headerBg = isDark ? withAlpha(colors.primaryDark, 0.9) : colors.primary;

  const resolveMetricColor = (tone: WorkspaceMetric['tone']) => {
    if (tone === 'positive') return '#D9FFF2';
    if (tone === 'danger') return colors.emergency;
    if (tone === 'warning') return '#FFF4CC';
    return '#FFFFFF';
  };

  const resolveMetricTone = (metric: WorkspaceMetric) =>
    metric.value.trim().startsWith('-') ? 'danger' : metric.tone;

  return (
    <View
      style={{
        borderRadius: isCompact ? BorderRadius.md : BorderRadius.xl,
        padding: isCompact ? Spacing.base : Spacing.xl,
        backgroundColor: headerBg,
        borderWidth: 1,
        borderColor: withAlpha(colors.primaryLight, isDark ? 0.34 : 0.28),
        gap: isCompact ? Spacing.md : Spacing.lg,
        minWidth: 0,
        overflow: 'hidden',
        ...Shadows.xl,
        shadowColor: colors.shadowColor,
        ...(strongGlassBackdropStyle ?? {}),
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.24)',
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
              backgroundColor: withAlpha(colors.primary, 0.2),
              borderWidth: 1,
              borderColor: withAlpha(colors.primaryLight, 0.34),
            }}
          >
            <MaterialCommunityIcons name={icon} size={isCompact ? 22 : 24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, minWidth: 0, maxWidth: 900 }}>
            <Text numberOfLines={1} style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: 'rgba(255, 255, 255, 0.68)' }}>
              {eyebrow}
            </Text>
            <Text style={{ marginTop: 4, fontSize: isCompact ? 26 : 34, lineHeight: isCompact ? 32 : 40, fontFamily: Typography.fontFamily.display, color: '#FFFFFF' }}>
              {title}
            </Text>
            <Text style={{ marginTop: 8, maxWidth: 780, fontSize: Typography.fontSize.sm, lineHeight: 22, color: 'rgba(255, 255, 255, 0.74)' }}>
              {description}
            </Text>
          </View>
        </View>
        {actions ? (
          <View
            style={{
              flexDirection: isCompact ? 'column' : 'row',
              flexWrap: isCompact ? 'nowrap' : 'wrap',
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {metrics.map((metric) => (
            <View
              key={metric.label}
              style={{
                flex: 1,
                minWidth: isCompact ? 136 : 160,
                padding: Spacing.md,
                borderRadius: BorderRadius.md,
                backgroundColor: 'rgba(255, 255, 255, 0.11)',
                borderWidth: 1,
                borderColor: withAlpha(metric.tone === 'warning' ? colors.warning : metric.tone === 'danger' ? colors.error : colors.primaryLight, 0.18),
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.xs, color: 'rgba(255, 255, 255, 0.64)' }}>{metric.label}</Text>
              <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: resolveMetricColor(resolveMetricTone(metric)) }}>
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
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                borderWidth: 1,
                borderColor: withAlpha(colors.primaryLight, 0.18),
              }}
            >
              <MaterialCommunityIcons name={chip.icon} size={14} color="rgba(255, 255, 255, 0.82)" />
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: 'rgba(255, 255, 255, 0.82)' }}>
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
