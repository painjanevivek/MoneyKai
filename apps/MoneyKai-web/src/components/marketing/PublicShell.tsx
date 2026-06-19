import React, { type PropsWithChildren } from 'react';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Colors, Shadows, Spacing, Typography, type ColorScheme } from '@/constants/theme';
import { SITE } from '@/constants/site';
import { useAuthStore } from '@/stores/useAuthStore';

type ShellProps = PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  description?: string;
  tone?: 'default' | 'light' | 'dark';
}>;

const PRIMARY_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/features/analytics', label: 'Reports' },
  { href: '/features/analytics', label: 'AI Insights' },
  { href: '/features/expense-tracking', label: 'Imports' },
  { href: '/features/savings', label: 'Portfolio' },
  { href: '/compare', label: 'Compare' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
] as const;

function BrandMark({ colors, lightMode }: { colors: ColorScheme; lightMode: boolean }) {
  return (
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: BorderRadius.sm,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: lightMode ? `${colors.primary}22` : 'rgba(255, 255, 255, 0.24)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...Shadows.md,
        shadowColor: colors.shadowColor,
      }}
    >
      <Image
        source={{ uri: '/brand/moneykai-mark.jpeg' }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
        style={{
          width: 34,
          height: 34,
        }}
      />
    </View>
  );
}

function ShellAction({
  title,
  href,
  colors,
  lightMode,
  primary = false,
  fullWidth = false,
}: {
  title: string;
  href: string;
  colors: ColorScheme;
  lightMode: boolean;
  primary?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={title}
      onPress={() => router.push(href as never)}
      style={({ hovered, pressed }: any) => ({
        minHeight: 46,
        width: fullWidth ? '100%' : undefined,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.sm,
        backgroundColor: primary ? colors.primary : hovered ? `${colors.primary}12` : 'transparent',
        borderWidth: 1,
        borderColor: primary
          ? colors.primary
          : lightMode
            ? colors.borderLight
            : 'rgba(255, 255, 255, 0.14)',
        transform: pressed ? [{ scale: 0.98 }] : hovered ? [{ translateY: -1 }] : [{ translateY: 0 }],
      })}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: Typography.fontSize.base,
          fontFamily: Typography.fontFamily.semiBold,
          color: primary ? colors.textInverse : lightMode ? colors.textPrimary : '#FFFFFF',
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function PublicShell({ eyebrow, title, description, children, tone = 'default' }: ShellProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const isWide = width >= 960;
  const isCompact = width < 640;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lightMode = tone === 'light';
  const shellColors = lightMode ? Colors.light : tone === 'dark' ? Colors.dark : colors;
  const navBackground = lightMode ? 'rgba(255, 255, 255, 0.94)' : 'rgba(3, 5, 4, 0.9)';
  const navBorder = lightMode ? shellColors.borderLight : 'rgba(234, 246, 240, 0.14)';
  const navText = lightMode ? shellColors.textPrimary : '#FFFFFF';
  const navMuted = lightMode ? shellColors.textSecondary : 'rgba(255, 255, 255, 0.68)';
  const navHover = lightMode ? `${shellColors.primary}0F` : 'rgba(234, 246, 240, 0.08)';
  const showMobileMenu = !isCompact || mobileMenuOpen;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: shellColors.background }}>
      <View style={{ flex: 1, backgroundColor: shellColors.background, overflow: 'hidden' }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: isWide ? 1 : 0,
            backgroundColor: lightMode ? 'rgba(203, 213, 225, 0.34)' : 'rgba(234, 246, 240, 0.08)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: isWide ? 1 : 0,
            backgroundColor: lightMode ? 'rgba(203, 213, 225, 0.26)' : 'rgba(234, 246, 240, 0.06)',
          }}
        />

        <ScrollView
          showsVerticalScrollIndicator={true}
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
                  borderRadius: BorderRadius.xl,
                  backgroundColor: navBackground,
                  borderWidth: 1,
                  borderColor: navBorder,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}>
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
                      backgroundColor: hovered ? navHover : 'transparent',
                      transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                    })}
                  >
                    <BrandMark colors={shellColors} lightMode={lightMode} />
                    <View>
                      <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: navText }}>
                        {SITE.name}
                      </Text>
                      <Text style={{ fontSize: Typography.fontSize.xs, color: navMuted }}>
                        Private finance reports
                      </Text>
                    </View>
                  </Pressable>

                  {isCompact ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                      accessibilityState={{ expanded: mobileMenuOpen }}
                      onPress={() => setMobileMenuOpen((value) => !value)}
                      style={({ hovered, pressed }: any) => ({
                        minHeight: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: Spacing.base,
                        borderRadius: BorderRadius.sm,
                        backgroundColor: hovered ? navHover : lightMode ? shellColors.surfaceElevated : 'rgba(255, 255, 255, 0.055)',
                        borderWidth: 1,
                        borderColor: lightMode ? shellColors.borderLight : 'rgba(255, 255, 255, 0.12)',
                        transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                      })}
                    >
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: navText }}>
                        {mobileMenuOpen ? 'Close' : 'Menu'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {!isCompact ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 4,
                      padding: 4,
                      borderRadius: BorderRadius.full,
                      backgroundColor: lightMode ? shellColors.surfaceElevated : 'rgba(255, 255, 255, 0.055)',
                      borderWidth: 1,
                      borderColor: lightMode ? shellColors.borderLight : 'rgba(255, 255, 255, 0.08)',
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
                            backgroundColor: hovered ? (lightMode ? '#FFFFFF' : 'rgba(234, 246, 240, 0.12)') : 'transparent',
                            borderWidth: 1,
                            borderColor: hovered ? (lightMode ? shellColors.border : 'rgba(234, 246, 240, 0.18)') : 'transparent',
                            transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                          })}
                        >
                          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: navText }}>
                            {item.label}
                          </Text>
                        </Pressable>
                      </Link>
                    ))}
                  </View>
                ) : null}

                {showMobileMenu && !isAuthenticated ? (
                  <View
                    style={{
                      flexDirection: isCompact ? 'column' : 'row',
                      gap: Spacing.sm,
                      alignSelf: isCompact ? 'stretch' : 'flex-start',
                    }}
                  >
                    <ShellAction
                      title="Sign in"
                      href="/login"
                      colors={shellColors}
                      lightMode={lightMode}
                      fullWidth={isCompact}
                    />
                    <ShellAction
                      title="Create secure account"
                      href="/signup"
                      colors={shellColors}
                      lightMode={lightMode}
                      primary
                      fullWidth={isCompact}
                    />
                  </View>
                ) : showMobileMenu ? (
                  <ShellAction title="Open app" href="/dashboard" colors={shellColors} lightMode={lightMode} primary />
                ) : null}

                {isCompact && showMobileMenu ? (
                  <View
                    accessibilityRole="menu"
                    style={{
                      gap: Spacing.xs,
                      paddingTop: Spacing.sm,
                      borderTopWidth: 1,
                      borderTopColor: navBorder,
                    }}
                  >
                    {PRIMARY_LINKS.map((item) => (
                      <Link key={`${item.href}-${item.label}`} href={item.href as any} asChild>
                        <Pressable
                          accessibilityRole="link"
                          accessibilityLabel={`Open ${item.label}`}
                          style={({ hovered, pressed }: any) => ({
                            paddingHorizontal: Spacing.md,
                            paddingVertical: 11,
                            borderRadius: BorderRadius.sm,
                            backgroundColor: hovered
                              ? (lightMode ? '#FFFFFF' : 'rgba(234, 246, 240, 0.12)')
                              : (lightMode ? shellColors.surfaceElevated : 'rgba(255, 255, 255, 0.055)'),
                            borderWidth: 1,
                            borderColor: hovered
                              ? (lightMode ? shellColors.border : 'rgba(234, 246, 240, 0.18)')
                              : (lightMode ? shellColors.borderLight : 'rgba(255, 255, 255, 0.08)'),
                            transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                          })}
                        >
                          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: navText }}>
                            {item.label}
                          </Text>
                        </Pressable>
                      </Link>
                    ))}
                  </View>
                ) : null}
              </View>
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
                      backgroundColor: shellColors.surface,
                      borderWidth: 1,
                      borderColor: shellColors.borderLight,
                    }}
                  >
                    <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: shellColors.primary }} />
                    <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: shellColors.textSecondary }}>
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
                      color: shellColors.textPrimary,
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
                      color: shellColors.textSecondary,
                    }}
                  >
                    {description}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View
              nativeID="main-content"
              role="main"
              style={{ flexGrow: 1, minHeight: 0, paddingBottom: Spacing['4xl'] }}
            >
              {children}
            </View>

            <View
              style={{
                paddingTop: Spacing.lg,
                paddingBottom: Spacing['2xl'],
                borderTopWidth: 1,
                borderTopColor: shellColors.borderLight,
                gap: Spacing.md,
                marginTop: Spacing['2xl'],
              }}
            >
              <View style={{ flexDirection: isWide ? 'row' : 'column', justifyContent: 'space-between', gap: Spacing.sm }}>
                <Text style={{ fontSize: Typography.fontSize.sm, color: shellColors.textSecondary, maxWidth: 560 }}>
                  MoneyKai turns user-provided records into private finance reports with review-first controls.
                </Text>
                <Text style={{ fontSize: Typography.fontSize.sm, color: shellColors.textTertiary }}>
                  Contact: {SITE.supportEmail}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                {[
                  { href: '/about', label: 'About' },
                  { href: '/faq', label: 'FAQ' },
                  { href: '/contact', label: 'Contact' },
                  { href: '/compare', label: 'Compare' },
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
                      <Text style={{ fontSize: Typography.fontSize.sm, color: shellColors.textTertiary }}>-&gt;</Text>
                      <Text style={{ fontSize: Typography.fontSize.sm, color: shellColors.textSecondary }}>{item.label}</Text>
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
