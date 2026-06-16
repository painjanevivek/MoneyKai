import React, { type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

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
  const { colors } = useTheme();

  const resolveMetricColor = (tone: WorkspaceMetric['tone']) => {
    if (tone === 'positive') return '#D9FFF2';
    if (tone === 'danger') return '#FFE1E5';
    if (tone === 'warning') return '#FFF4CC';
    return '#FFFFFF';
  };

  return (
    <View
      style={{
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        backgroundColor: colors.primaryDark,
        borderWidth: 1,
        borderColor: 'rgba(234, 246, 240, 0.18)',
        gap: Spacing.lg,
        ...Shadows.lg,
        shadowColor: colors.shadowColor,
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
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.13)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.18)',
          }}
        >
          <MaterialCommunityIcons name={icon} size={24} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: 'rgba(255, 255, 255, 0.68)' }}>
            {eyebrow}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 34, lineHeight: 40, fontFamily: Typography.fontFamily.display, color: '#FFFFFF' }}>
            {title}
          </Text>
          <Text style={{ marginTop: 8, maxWidth: 780, fontSize: Typography.fontSize.sm, lineHeight: 22, color: 'rgba(255, 255, 255, 0.74)' }}>
            {description}
          </Text>
        </View>
        {actions ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: Spacing.sm }}>{actions}</View> : null}
      </View>

      {metrics.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {metrics.map((metric) => (
            <View
              key={metric.label}
              style={{
                flex: 1,
                minWidth: 160,
                padding: Spacing.md,
                borderRadius: BorderRadius.md,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.13)',
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.xs, color: 'rgba(255, 255, 255, 0.64)' }}>{metric.label}</Text>
              <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: resolveMetricColor(metric.tone) }}>
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
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
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
