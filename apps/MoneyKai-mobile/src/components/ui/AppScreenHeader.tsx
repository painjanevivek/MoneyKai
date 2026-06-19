import React, { type ReactNode } from 'react';
import { Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';

type HeaderMetric = {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'danger' | 'warning';
};

type HeaderChip = {
  icon: string;
  label: string;
};

type AppScreenHeaderProps = {
  actions?: ReactNode;
  chips?: HeaderChip[];
  description: string;
  eyebrow?: string;
  icon: string;
  metrics?: HeaderMetric[];
  title: string;
};

export function AppScreenHeader({
  actions,
  chips = [],
  description,
  eyebrow = 'MONEYKAI WORKSPACE',
  icon,
  metrics = [],
  title,
}: AppScreenHeaderProps) {
  const { colors, isDark } = useTheme();
  const headerBg = isDark ? colors.primaryBg : colors.primaryDark;

  const resolveMetricColor = (tone: HeaderMetric['tone']) => {
    if (tone === 'positive') return '#D9FFF2';
    if (tone === 'danger') return '#FFE1E5';
    if (tone === 'warning') return '#FFF4CC';
    return '#FFFFFF';
  };

  return (
    <View
      style={{
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        backgroundColor: headerBg,
        borderWidth: 1,
        borderColor: `${colors.primaryLight}30`,
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
            width: 44,
            height: 44,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.13)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.18)',
          }}
        >
          <MaterialCommunityIcons name={icon as any} size={22} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: 'rgba(255, 255, 255, 0.68)' }}>
            {eyebrow}
          </Text>
          <Text style={{ marginTop: 4, fontSize: Typography.fontSize['2xl'], lineHeight: 31, fontFamily: Typography.fontFamily.display, color: '#FFFFFF' }}>
            {title}
          </Text>
          <Text style={{ marginTop: 7, fontSize: Typography.fontSize.sm, lineHeight: 20, color: 'rgba(255, 255, 255, 0.74)' }}>
            {description}
          </Text>
        </View>
      </View>

      {metrics.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {metrics.map((metric) => (
            <View
              key={metric.label}
              style={{
                flex: 1,
                minHeight: 78,
                padding: Spacing.md,
                borderRadius: BorderRadius.md,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.13)',
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.xs, color: 'rgba(255, 255, 255, 0.64)' }}>{metric.label}</Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.76}
                style={{
                  marginTop: 3,
                  fontSize: Typography.fontSize.lg,
                  fontFamily: Typography.fontFamily.bold,
                  color: resolveMetricColor(metric.tone),
                }}
              >
                {metric.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {(chips.length > 0 || actions) ? (
        <View style={{ gap: Spacing.md }}>
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
                  <MaterialCommunityIcons name={chip.icon as any} size={14} color="rgba(255, 255, 255, 0.82)" />
                  <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: 'rgba(255, 255, 255, 0.82)' }}>
                    {chip.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {actions ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>{actions}</View> : null}
        </View>
      ) : null}
    </View>
  );
}

export default AppScreenHeader;
