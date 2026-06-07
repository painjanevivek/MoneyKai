import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Link, Redirect, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const FEATURES = [
  {
    icon: 'wallet-outline',
    title: 'Budget at a glance',
    body: 'Track allowance, savings, expenses, and emergency mode in one calm dashboard.',
  },
  {
    icon: 'account-group-outline',
    title: 'Group expenses',
    body: 'Split bills with friends and flatmates without losing the thread.',
  },
  {
    icon: 'cloud-lock-outline',
    title: 'Backup ready',
    body: 'Cloud backup and restore keep your financial history safe across devices.',
  },
];

export default function LandingScreen() {
  const { colors } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  const primaryCta = () => router.push('/(auth)/signup');
  const secondaryCta = () => router.push('/(auth)/login');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: Spacing['3xl'] }}
        showsVerticalScrollIndicator={false}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 420,
            backgroundColor: colors.primaryBg,
            opacity: 0.65,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 72,
            right: -48,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: `${colors.primary}14`,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 180,
            left: -56,
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: `${colors.accent}16`,
          }}
        />

        <View style={{ paddingTop: Spacing.xl, paddingBottom: Spacing['2xl'] }}>
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: Spacing.md,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderLight,
              marginBottom: Spacing.lg,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
              MoneyKai for everyday money discipline
            </Text>
          </View>

          <Text
            style={{
              fontSize: 44,
              lineHeight: 48,
              fontFamily: Typography.fontFamily.display,
              color: colors.textPrimary,
              maxWidth: 340,
            }}
          >
            Budgeting that feels clear, not crowded.
          </Text>
          <Text
            style={{
              marginTop: Spacing.md,
              maxWidth: 360,
              fontSize: Typography.fontSize.base,
              lineHeight: 24,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textSecondary,
            }}
          >
            MoneyKai helps you track allowances, split group expenses, save for goals, and keep a clean backup of everything that matters.
          </Text>

          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl, flexWrap: 'wrap' }}>
            <TouchableOpacity
              onPress={primaryCta}
              activeOpacity={0.85}
              style={{
                paddingHorizontal: Spacing.lg,
                paddingVertical: 14,
                borderRadius: BorderRadius.md,
                backgroundColor: colors.primary,
                ...Shadows.lg,
                shadowColor: colors.primary,
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                Create account
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={secondaryCta}
              activeOpacity={0.85}
              style={{
                paddingHorizontal: Spacing.lg,
                paddingVertical: 14,
                borderRadius: BorderRadius.md,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg, flexWrap: 'wrap' }}>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity activeOpacity={0.8}>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.primary }}>
                  Already have an account? Open login
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View style={{ gap: Spacing.md, marginBottom: Spacing['2xl'] }}>
          {FEATURES.map((feature) => (
            <View
              key={feature.title}
              style={{
                backgroundColor: colors.card,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: colors.borderLight,
                padding: Spacing.lg,
                ...Shadows.sm,
                shadowColor: colors.shadowColor,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: colors.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name={feature.icon as any} size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {feature.title}
                  </Text>
                  <Text style={{ marginTop: 4, fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
                    {feature.body}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: BorderRadius.xl,
            padding: Spacing.lg,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
            A better homepage for SEO
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
            A real homepage should explain what MoneyKai does, who it is for, and why someone should trust it before asking them to log in.
            Search engines can index this page, while `/login` stays a dedicated authentication route.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
