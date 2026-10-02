import React, { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { MoneyKaiBrandMark } from '@/components/branding/MoneyKaiBrandMark';
import { AppIcon } from './AppIcon';

type CanvasTone = 'paper' | 'cream' | 'lime' | 'olive' | 'ink';

export function EditorialMasthead({
  actions,
  section,
  compact = false,
}: {
  actions?: ReactNode;
  section?: string;
  compact?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: compact ? 0 : Spacing.lg }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', minHeight: 44 }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', flex: 1, gap: Spacing.sm }}>
          <View
            style={{
              alignItems: 'center',
              borderColor: colors.textPrimary,
              borderRadius: BorderRadius.full,
              borderWidth: 1.5,
              height: 24,
              justifyContent: 'center',
              width: 24,
            }}
          >
            <MoneyKaiBrandMark color={colors.textPrimary} size={14} variant="glyph" />
          </View>
          <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.sm, letterSpacing: -0.3 }}>
            MoneyKai
          </Text>
        </View>
        {section ? <Text style={{ color: colors.textTertiary, fontFamily: Typography.fontFamily.medium, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          {section}
        </Text> : null}
        {actions ? <View style={{ flexDirection: 'row', gap: Spacing.xs, marginLeft: Spacing.md }}>{actions}</View> : null}
      </View>
      <View style={{ backgroundColor: colors.borderLight, height: 1, marginTop: Spacing.sm }} />
    </View>
  );
}

export function EditorialIntro({
  description,
  eyebrow,
  title,
}: {
  description?: string;
  eyebrow?: string;
  title: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: Spacing.xl }}>
      {eyebrow ? (
        <Text style={{ color: colors.accent, fontFamily: Typography.fontFamily.semiBold, fontSize: 12, letterSpacing: 1.4, marginBottom: Spacing.sm, textTransform: 'uppercase' }}>
          {eyebrow}
        </Text>
      ) : null}
      <Text
        style={{
          color: colors.textPrimary,
          fontFamily: Typography.fontFamily.display,
          fontSize: 24,
          letterSpacing: -0.6,
          lineHeight: 28,
          maxWidth: 360,
        }}
      >
        {title}
      </Text>
      {description ? (
        <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, lineHeight: 18, marginTop: Spacing.sm, maxWidth: 360 }}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

export function FeatureCanvas({
  children,
  style,
  tone = 'paper',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: CanvasTone;
}) {
  const { colors } = useTheme();
  const backgroundColor = {
    paper: colors.card,
    cream: colors.surfaceElevated,
    lime: colors.primaryBg,
    olive: colors.accent,
    ink: colors.textPrimary,
  }[tone];
  const borderColor = tone === 'paper' ? colors.borderLight : backgroundColor;

  return (
    <View
      style={[
        {
          backgroundColor,
          borderColor,
          borderRadius: BorderRadius.md,
          borderWidth: 1,
          overflow: 'hidden',
          padding: Spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export type EditorialMetric = {
  label: string;
  value: string;
};

export function MetricRail({
  dark = false,
  ink = false,
  metrics,
}: {
  dark?: boolean;
  ink?: boolean;
  metrics: EditorialMetric[];
}) {
  const { colors } = useTheme();
  const foreground = dark ? '#FAFAF6' : colors.textPrimary;
  const rule = dark ? 'rgba(250,250,246,0.24)' : ink ? colors.border : colors.borderLight;

  return (
    <View style={{ borderBottomColor: rule, borderBottomWidth: 1, borderTopColor: rule, borderTopWidth: 1, flexDirection: 'row' }}>
      {metrics.map((metric, index) => (
        <View
          key={metric.label}
          style={{
            borderLeftColor: rule,
            borderLeftWidth: index === 0 ? 0 : 1,
            flex: 1,
            minWidth: 0,
            paddingHorizontal: index === 0 ? 0 : Spacing.sm,
            paddingVertical: Spacing.md,
          }}
        >
          <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: foreground, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize.xl, lineHeight: 24 }}>
            {metric.value}
          </Text>
          <Text numberOfLines={1} style={{ color: foreground, fontFamily: Typography.fontFamily.regular, fontSize: 12, marginTop: 2 }}>
            {metric.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function SectionHeading({
  action,
  compact = false,
  index,
  title,
}: {
  action?: ReactNode;
  compact?: boolean;
  index?: string;
  title: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md, marginTop: compact ? Spacing.md : Spacing.xl }}>
      {index ? (
        <Text style={{ color: colors.accent, fontFamily: Typography.fontFamily.medium, fontSize: 12, letterSpacing: 1, paddingBottom: 4 }}>
          {index}
        </Text>
      ) : null}
      <Text style={{ color: colors.textPrimary, flex: 1, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize['2xl'], letterSpacing: -0.25, lineHeight: 25 }}>
        {title}
      </Text>
      {action}
    </View>
  );
}

export function SignalPill({
  icon,
  label,
  strong = false,
}: {
  icon?: string;
  label: string;
  strong?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: strong ? colors.primary : colors.surfaceElevated,
        borderRadius: BorderRadius.full,
        flexDirection: 'row',
        gap: 6,
        minHeight: 28,
        paddingHorizontal: Spacing.md,
      }}
    >
      {icon ? <AppIcon color={strong ? colors.textInverse : colors.textPrimary} name={icon} size={13} /> : null}
      <Text style={{ color: strong ? colors.textInverse : colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}
