import React, { type PropsWithChildren } from 'react';
import { Image } from 'expo-image';
import { Link, router, usePathname } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useHydratedViewportWidth } from '@/hooks/useHydratedViewportWidth';
import { BorderRadius, Colors, Shadows, Spacing, Typography, type ColorScheme } from '@/constants/theme';
import { SITE } from '@/constants/site';
import { useAuthStore } from '@/stores/useAuthStore';
import { glassBackdropStyle, withAlpha } from '@/utils/glassStyle';

type ShellProps = PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  description?: string;
  tone?: 'default' | 'light' | 'dark';
}>;

const PRIMARY_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
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
        source={{ uri: '/brand/moneykai-mark-96.png' }}
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
        borderRadius: BorderRadius.md,
        backgroundColor: primary ? colors.primary : hovered ? withAlpha(colors.accent, 0.14) : 'transparent',
        borderWidth: 1,
        borderColor: primary
          ? colors.primary
          : lightMode
            ? colors.glassBorder
            : withAlpha(colors.primary, 0.18),
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
  const width = useHydratedViewportWidth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const isWide = width >= 960;
  const isCompact = width < 640;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lightMode = tone === 'light';
  const shellColors = lightMode ? Colors.light : tone === 'dark' ? Colors.dark : colors;
  const navBackground = lightMode ? 'rgba(255, 255, 255, 0.94)' : shellColors.surface;
  const navBorder = lightMode ? shellColors.glassBorder : withAlpha(shellColors.primary, 0.2);
  const navText = lightMode ? shellColors.textPrimary : '#FFFFFF';
  const navMuted = lightMode ? shellColors.textSecondary : 'rgba(255, 255, 255, 0.68)';
  const navHover = lightMode ? withAlpha(shellColors.primary, 0.1) : withAlpha(shellColors.primary, 0.14);
  const showMobileMenu = !isCompact || mobileMenuOpen;
  const isNavItemActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

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
                  ...Shadows.lg,
                  shadowColor: shellColors.shadowColor,
                  ...(glassBackdropStyle ?? {}),
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
                      columnGap: Spacing.xs,
                      rowGap: Spacing.xs,
                      padding: 6,
                      borderRadius: BorderRadius.full,
          backgroundColor: lightMode ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 255, 255, 0.055)',
          borderWidth: 1,
          borderColor: lightMode ? shellColors.glassBorder : withAlpha(shellColors.primary, 0.18),
                    }}
                  >
                    {PRIMARY_LINKS.map((item) => {
                      const active = isNavItemActive(item.href);
                      return (
                        <Link key={`${item.href}-${item.label}`} href={item.href as any} asChild>
                          <Pressable
                            accessibilityRole="link"
                            accessibilityLabel={`Open ${item.label}`}
                            accessibilityState={{ selected: active }}
                            style={({ hovered, pressed }: any) => {
                              const highlighted = active || hovered;
                              return {
                                minHeight: 34,
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingHorizontal: 14,
                                paddingVertical: 8,
                                borderRadius: BorderRadius.full,
                                backgroundColor: highlighted
                                  ? (lightMode ? '#FFFFFF' : withAlpha(shellColors.primary, 0.16))
                                  : 'transparent',
                                borderWidth: 1,
                                borderColor: highlighted
                                  ? (lightMode ? shellColors.glassBorder : withAlpha(shellColors.primaryLight, 0.24))
                                  : 'transparent',
                                transform: pressed ? [{ scale: 0.98 }] : hovered ? [{ translateY: -1 }] : [{ translateY: 0 }],
                              };
                            }}
                          >
                            <Text
                              numberOfLines={1}
                              style={{
                                color: active ? navText : lightMode ? shellColors.textSecondary : 'rgba(255, 255, 255, 0.82)',
                                fontFamily: active ? Typography.fontFamily.semiBold : Typography.fontFamily.medium,
                                fontSize: Typography.fontSize.sm,
                                lineHeight: 18,
                              }}
                            >
                              {item.label}
                            </Text>
                          </Pressable>
                        </Link>
                      );
                    })}
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
                      backgroundColor: shellColors.glassBg,
                      borderWidth: 1,
                      borderColor: shellColors.glassBorder,
                    }}
                  >
                    <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: shellColors.accent }} />
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
                  { href: '/services', label: 'Services' },
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
          overflow: 'hidden',
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
