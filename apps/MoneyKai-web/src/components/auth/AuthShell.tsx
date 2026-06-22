import React, { type ReactNode } from 'react';
import { Image, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { strongGlassBackdropStyle, withAlpha } from '@/utils/glassStyle';

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  showHero?: boolean;
};

const TRUST_POINTS = [
  { icon: 'shield-check-outline', label: 'User-controlled financial data' },
  { icon: 'file-eye-outline', label: 'Review imports before saving' },
  { icon: 'cloud-lock-outline', label: 'Backup and privacy controls' },
] as const;

export function AuthShell({ children, eyebrow, title, subtitle, showHero = true }: AuthShellProps) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const formOnly = !showHero;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, overflow: 'hidden' }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -180,
          right: -120,
          width: 360,
          height: 360,
          borderRadius: 999,
          backgroundColor: withAlpha(colors.primary, isDark ? 0.14 : 0.1),
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -180,
          left: -120,
          width: 340,
          height: 340,
          borderRadius: 999,
          backgroundColor: withAlpha(colors.accent, isDark ? 0.16 : 0.1),
        }}
      />
      <ScrollView
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: formOnly ? (width >= 760 ? Spacing.xl : Spacing.base) : isWide ? Spacing['2xl'] : Spacing.base,
          paddingVertical: formOnly ? (width >= 760 ? Spacing['2xl'] : Spacing.base) : isWide ? Spacing['2xl'] : Spacing.base,
        }}
      >
        <View
          style={{
            flexGrow: 1,
            alignItems: formOnly ? 'center' : 'stretch',
            flexDirection: formOnly ? 'column' : isWide ? 'row' : 'column',
            gap: formOnly ? 0 : Spacing.lg,
            justifyContent: formOnly ? 'center' : undefined,
          }}
        >
          {showHero ? (
            <View
              style={{
                flex: isWide ? 1 : undefined,
                minHeight: isWide ? 560 : 260,
                borderRadius: BorderRadius.xl,
                padding: isWide ? Spacing['2xl'] : Spacing.xl,
                backgroundColor: isDark ? withAlpha(colors.surfaceElevated, 0.9) : colors.primaryDark,
                borderWidth: 1,
                borderColor: withAlpha(colors.primaryLight, 0.26),
                justifyContent: 'space-between',
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
                  top: -120,
                  right: -90,
                  width: 260,
                  height: 260,
                  borderRadius: 999,
                  backgroundColor: withAlpha(colors.primary, 0.18),
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  bottom: -120,
                  left: -70,
                  width: 230,
                  height: 230,
                  borderRadius: 999,
                  backgroundColor: withAlpha(colors.accent, 0.18),
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: 'rgba(255,255,255,0.24)',
                }}
              />
              <View style={{ gap: Spacing.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: BorderRadius.md,
                      backgroundColor: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Image
                      source={require('../../../assets/images/moneykai-logo.png')}
                      style={{ width: 38, height: 38 }}
                      resizeMode="contain"
                      accessibilityLabel="MoneyKai logo"
                    />
                  </View>
                  <View>
                    <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' }}>
                      MoneyKai
                    </Text>
                    <Text style={{ fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.68)' }}>
                      Private finance reports
                    </Text>
                  </View>
                </View>

                <View style={{ maxWidth: 620 }}>
                  <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: 'rgba(255,255,255,0.64)' }}>
                    {eyebrow}
                  </Text>
                  <Text style={{ marginTop: Spacing.sm, fontSize: isWide ? 46 : 34, lineHeight: isWide ? 52 : 40, fontFamily: Typography.fontFamily.display, color: '#FFFFFF' }}>
                    {title}
                  </Text>
                  <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.md, lineHeight: 26, color: 'rgba(255,255,255,0.74)' }}>
                    {subtitle}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xl }}>
                {TRUST_POINTS.map((point) => (
                  <View
                    key={point.label}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 7,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: 10,
                      borderRadius: BorderRadius.full,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      borderWidth: 1,
                      borderColor: withAlpha(colors.primaryLight, 0.2),
                    }}
                  >
                    <MaterialCommunityIcons name={point.icon} size={15} color="rgba(255,255,255,0.84)" />
                    <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: 'rgba(255,255,255,0.82)' }}>
                      {point.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View
            nativeID="main-content"
            role="main"
            style={{
              flex: formOnly ? undefined : isWide ? 0.8 : undefined,
              justifyContent: 'center',
              maxWidth: formOnly ? 1200 : isWide ? 560 : undefined,
              alignSelf: formOnly ? 'center' : 'stretch',
              width: formOnly ? '100%' : undefined,
            }}
          >
            {children}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default AuthShell;
