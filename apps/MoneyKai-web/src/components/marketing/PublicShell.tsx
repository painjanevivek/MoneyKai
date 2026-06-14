import React, { type PropsWithChildren } from 'react';
import { Link, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { SITE } from '@/constants/site';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';

type ShellProps = PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  description?: string;
}>;

const PRIMARY_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/features/analytics', label: 'Reports' },
  { href: '/features/analytics', label: 'AI Insights' },
  { href: '/features/expense-tracking', label: 'Imports' },
  { href: '/features/savings', label: 'Portfolio' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
] as const;

export function PublicShell({ eyebrow, title, description, children }: ShellProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isCompact = width < 640;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, backgroundColor: colors.background, overflow: 'hidden' }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -180,
            right: -120,
            width: 460,
            height: 460,
            borderRadius: 999,
            backgroundColor: 'rgba(225, 243, 233, 0.12)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 20,
            left: -180,
            width: 420,
            height: 420,
            borderRadius: 999,
            backgroundColor: 'rgba(174, 209, 188, 0.11)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: '32%',
            left: '18%',
            width: 260,
            height: 260,
            borderRadius: 999,
            backgroundColor: 'rgba(245, 250, 247, 0.045)',
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: Spacing['4xl'] }}
        >
          <View style={{ width: '100%', maxWidth: 1180, alignSelf: 'center', flexGrow: 1, paddingHorizontal: Spacing.base }}>
            <View
              style={{
                gap: isCompact ? Spacing.sm : Spacing.md,
                paddingTop: isCompact ? Spacing.sm : Spacing.base,
                paddingBottom: Spacing.lg,
              }}
            >
              <View
                style={{
                  flexDirection: isWide ? 'row' : 'column',
                  alignItems: isWide ? 'center' : 'stretch',
                  justifyContent: 'space-between',
                  gap: isCompact ? Spacing.sm : Spacing.md,
                  padding: isCompact ? Spacing.sm : Spacing.md,
                  borderRadius: 32,
                  backgroundColor: 'rgba(2, 3, 3, 0.78)',
                  borderWidth: 1,
                  borderColor: 'rgba(234, 246, 240, 0.1)',
                }}
              >
                <Pressable
                  onPress={() => router.push('/')}
                  accessibilityRole="link"
                  accessibilityLabel="Go to MoneyKai home"
                  style={({ hovered, pressed }: any) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    alignSelf: 'flex-start',
                    padding: 6,
                    margin: -6,
                    borderRadius: BorderRadius.lg,
                    backgroundColor: hovered ? 'rgba(234, 246, 240, 0.08)' : 'transparent',
                    transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                  })}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: 'rgba(247, 250, 248, 0.96)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.24)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...Shadows.md,
                      shadowColor: colors.shadowColor,
                    }}
                  >
                    <Image
                      source={require('../../../assets/images/moneykai-logo.png')}
                      style={{ width: 34, height: 34 }}
                      resizeMode="contain"
                      accessibilityLabel="MoneyKai logo"
                    />
                  </View>
                  <View>
                    <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      {SITE.name}
                    </Text>
                    <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                      AI report engine
                    </Text>
                  </View>
                </Pressable>

                {!isCompact ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 4,
                      padding: 4,
                      borderRadius: BorderRadius.full,
                      backgroundColor: 'rgba(255, 255, 255, 0.055)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {PRIMARY_LINKS.map((item) => (
                      <Link key={`${item.href}-${item.label}`} href={item.href as any} asChild>
                        <Pressable
                          accessibilityRole="link"
                          accessibilityLabel={`Open ${item.label}`}
                          style={({ hovered, pressed }: any) => ({
                            paddingHorizontal: Spacing.md,
                            paddingVertical: 9,
                            borderRadius: BorderRadius.full,
                            backgroundColor: hovered ? 'rgba(234, 246, 240, 0.12)' : 'transparent',
                            borderWidth: 1,
                            borderColor: hovered ? 'rgba(234, 246, 240, 0.18)' : 'transparent',
                            transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                          })}
                        >
                          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                            {item.label}
                          </Text>
                        </Pressable>
                      </Link>
                    ))}
                  </View>
                ) : null}

                {!isAuthenticated ? (
                  <View
                    style={{
                      flexDirection: isCompact ? 'column' : 'row',
                      gap: Spacing.sm,
                      alignSelf: isCompact ? 'stretch' : 'flex-start',
                    }}
                  >
                    <Button
                      title="Sign in"
                      onPress={() => router.push('/(auth)/login')}
                      variant="ghost"
                      fullWidth={isCompact}
                    />
                    <Button
                      title="Create account"
                      onPress={() => router.push('/(auth)/signup')}
                      fullWidth={isCompact}
                      icon="account-plus-outline"
                    />
                  </View>
                ) : (
                  <Button title="Open app" onPress={() => router.push('/(tabs)')} icon="arrow-top-right" />
                )}
              </View>

              {isCompact ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: Spacing.xs, paddingRight: Spacing.base }}
                >
                  {PRIMARY_LINKS.map((item) => (
                    <Link key={`${item.href}-${item.label}`} href={item.href as any} asChild>
                      <Pressable
                        accessibilityRole="link"
                        accessibilityLabel={`Open ${item.label}`}
                        style={({ hovered, pressed }: any) => ({
                          paddingHorizontal: Spacing.md,
                          paddingVertical: 10,
                          borderRadius: BorderRadius.full,
                          backgroundColor: hovered ? 'rgba(234, 246, 240, 0.12)' : 'rgba(255, 255, 255, 0.055)',
                          borderWidth: 1,
                          borderColor: hovered ? 'rgba(234, 246, 240, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                          transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                        })}
                      >
                        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                          {item.label}
                        </Text>
                      </Pressable>
                    </Link>
                  ))}
                </ScrollView>
              ) : null}
            </View>

            {(title || description) ? (
              <View style={{ gap: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing['2xl'] }}>
                {eyebrow ? (
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: 8,
                      borderRadius: BorderRadius.full,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                    }}
                  >
                    <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: colors.primary }} />
                    <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
                      {eyebrow}
                    </Text>
                  </View>
                ) : null}

                {title ? (
                  <Text
                    style={{
                      maxWidth: 860,
                      fontSize: isWide ? 52 : 36,
                      lineHeight: isWide ? 56 : 40,
                      fontFamily: Typography.fontFamily.display,
                      color: colors.textPrimary,
                    }}
                  >
                    {title}
                  </Text>
                ) : null}

                {description ? (
                  <Text
                    style={{
                      maxWidth: 760,
                      fontSize: Typography.fontSize.md,
                      lineHeight: 26,
                      color: colors.textSecondary,
                    }}
                  >
                    {description}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View style={{ flexGrow: 1, minHeight: 0, paddingBottom: Spacing['4xl'] }}>{children}</View>

            <View
              style={{
                paddingTop: Spacing.lg,
                paddingBottom: Spacing['2xl'],
                borderTopWidth: 1,
                borderTopColor: colors.borderLight,
                gap: Spacing.md,
                marginTop: Spacing['2xl'],
              }}
            >
              <View style={{ flexDirection: isWide ? 'row' : 'column', justifyContent: 'space-between', gap: Spacing.sm }}>
                <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, maxWidth: 560 }}>
                  MoneyKai turns user-provided statements, pasted records, portfolios, and manual entries into AI-powered financial reports. No hidden SMS reading. No background transaction capture.
                </Text>
                <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textTertiary }}>
                  Contact: {SITE.supportEmail}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                {[
                  { href: '/about', label: 'About' },
                  { href: '/faq', label: 'FAQ' },
                  { href: '/contact', label: 'Contact' },
                  { href: '/pricing', label: 'Pricing' },
                  { href: '/news', label: 'News' },
                  { href: '/privacy-policy', label: 'Privacy policy' },
                  { href: '/security', label: 'Security' },
                  { href: '/terms', label: 'Terms' },
                ].map((item) => (
                  <Link key={item.href} href={item.href as any} asChild>
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel={`Open ${item.label}`}
                      style={({ hovered }: any) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 4,
                        paddingRight: 6,
                        opacity: hovered ? 1 : 0.9,
                      })}
                    >
                      <MaterialCommunityIcons name="arrow-top-right" size={14} color={colors.textTertiary} />
                      <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>{item.label}</Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export function SectionCard({
  children,
  style,
  variant = 'default',
  borderRadius = 'xl',
}: PropsWithChildren<{
  style?: object;
  variant?: 'default' | 'elevated' | 'outlined';
  borderRadius?: keyof typeof BorderRadius;
}>) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: variant === 'elevated' ? colors.surfaceElevated : colors.card,
          borderRadius: BorderRadius[borderRadius],
          padding: Spacing.lg,
          ...(variant === 'outlined'
            ? { borderWidth: 1, borderColor: colors.borderLight }
            : {
                borderWidth: 1,
                borderColor: colors.borderLight,
                ...(variant === 'elevated' ? { ...Shadows.lg } : { ...Shadows.md }),
                shadowColor: colors.shadowColor,
              }),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
