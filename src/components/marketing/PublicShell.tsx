import React, { type PropsWithChildren } from 'react';
import { Link, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/security', label: 'Security' },
  { href: '/learn', label: 'Learn' },
] as const;

export function PublicShell({ eyebrow, title, description, children }: ShellProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isCompact = width < 640;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -160,
            right: -100,
            width: 320,
            height: 320,
            borderRadius: 999,
            backgroundColor: `${colors.primary}08`,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 120,
            left: -120,
            width: 280,
            height: 280,
            borderRadius: 999,
            backgroundColor: `${colors.accent}10`,
          }}
        />

        <View style={{ width: '100%', maxWidth: 1180, alignSelf: 'center', flex: 1, paddingHorizontal: Spacing.base }}>
          <View style={{ gap: isCompact ? Spacing.sm : Spacing.md, paddingTop: isCompact ? Spacing.sm : Spacing.base, paddingBottom: Spacing.lg }}>
            <View
              style={{
                flexDirection: isWide ? 'row' : 'column',
                alignItems: isWide ? 'center' : 'stretch',
                justifyContent: 'space-between',
                gap: isCompact ? Spacing.sm : Spacing.md,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'flex-start' }}
              >
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 16,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
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
                  />
                </View>
                <View>
                  <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {SITE.name}
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                    Calm personal finance for real life
                  </Text>
                </View>
              </TouchableOpacity>

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
                    variant="outline"
                    fullWidth={isCompact}
                  />
                  <Button
                    title="Create account"
                    onPress={() => router.push('/(auth)/signup')}
                    fullWidth={isCompact}
                  />
                </View>
              ) : (
                <Button title="Open app" onPress={() => router.push('/(tabs)')} />
              )}
            </View>

            {isCompact ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.xs, paddingRight: Spacing.base }}>
                {PRIMARY_LINKS.map((item) => (
                  <Link key={item.href} href={item.href as any} asChild>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: Spacing.md,
                        paddingVertical: 10,
                        borderRadius: BorderRadius.full,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.borderLight,
                      }}
                    >
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  </Link>
                ))}
              </ScrollView>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
                {PRIMARY_LINKS.map((item) => (
                  <Link key={item.href} href={item.href as any} asChild>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={{
                        paddingHorizontal: Spacing.md,
                        paddingVertical: 10,
                        borderRadius: BorderRadius.full,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.borderLight,
                      }}
                    >
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  </Link>
                ))}
              </View>
            )}
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

          <View style={{ flex: 1, paddingBottom: Spacing['3xl'] }}>{children}</View>

          <View
            style={{
              paddingTop: Spacing.lg,
              paddingBottom: Spacing['2xl'],
              borderTopWidth: 1,
              borderTopColor: colors.borderLight,
              gap: Spacing.md,
            }}
          >
            <View style={{ flexDirection: isWide ? 'row' : 'column', justifyContent: 'space-between', gap: Spacing.sm }}>
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, maxWidth: 520 }}>
                MoneyKai helps people understand spending, savings, shared costs, notes, backup and restore, and financial first-aid decisions from one place.
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
                { href: '/privacy-policy', label: 'Privacy policy' },
                { href: '/security', label: 'Security' },
                { href: '/terms', label: 'Terms' },
              ].map((item) => (
                <Link key={item.href} href={item.href as any} asChild>
                  <TouchableOpacity activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="arrow-top-right" size={14} color={colors.textTertiary} />
                    <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>{item.label}</Text>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export function SectionCard({ children, style }: PropsWithChildren<{ style?: object }>) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: BorderRadius.xl,
          borderWidth: 1,
          borderColor: colors.borderLight,
          padding: Spacing.lg,
          ...Shadows.md,
          shadowColor: colors.shadowColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
