import React from 'react';
import { Link, Redirect, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Button } from '@/components/ui/Button';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { HOME_FAQS, PUBLIC_FEATURES } from '@/content/publicSite';
import { SITE } from '@/constants/site';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';

const PROBLEMS = [
  'People lose track of daily expenses.',
  'Monthly budgets become hard to manage.',
  'Shared expenses with friends, family, couples, or roommates become confusing.',
  'Savings goals are easy to forget.',
  'Financial emergencies feel stressful when users do not have a clear plan.',
];

const TRUST_POINTS = [
  'Secure login',
  'User-controlled data',
  'Cloud backup and restore',
  'Privacy-first approach',
  'Clear data handling',
];

export default function LandingScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isWide = width >= 960;

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <>
      <SeoHead
        title={SITE.title}
        description={SITE.description}
        path="/"
        keywords={['budget management app', 'personal finance app', 'shared expense tracker', 'financial first aid']}
      />
      <PublicShell>
        <View style={{ gap: Spacing.xl }}>
          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
            <SectionCard style={{ flex: 1.3 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                PERSONAL FINANCE AND BUDGET MANAGEMENT
              </Text>
              <Text
                style={{
                  marginTop: Spacing.md,
                  fontSize: isWide ? 52 : 38,
                  lineHeight: isWide ? 56 : 42,
                  fontFamily: Typography.fontFamily.display,
                  color: colors.textPrimary,
                }}
              >
                Take control of your money with MoneyKai
              </Text>
              <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.md, lineHeight: 26, color: colors.textSecondary }}>
                Track expenses, manage budgets, handle shared spending, and build better money habits with a simple personal finance app designed for everyday life.
              </Text>
              <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.sm, marginTop: Spacing.lg }}>
                <Button
                  title="Get Started"
                  onPress={() => router.push('/(auth)/signup')}
                  size="lg"
                  style={{ minWidth: isWide ? 180 : '100%' }}
                />
                <Button
                  title="Explore Features"
                  onPress={() => router.push('/features')}
                  size="lg"
                  variant="outline"
                  style={{ minWidth: isWide ? 180 : '100%' }}
                />
              </View>
            </SectionCard>

            <SectionCard style={{ flex: 0.9 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                WHY THE PUBLIC SITE MATTERS
              </Text>
              <View style={{ marginTop: Spacing.md, gap: Spacing.md }}>
                {[
                  'A public homepage that explains the product clearly',
                  'Feature pages that support discoverability',
                  'Trust, privacy, and security context before signup',
                  'Original Learn content instead of scraped SEO filler',
                ].map((point) => (
                  <View key={point} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.primary} />
                    <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                      {point}
                    </Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          </View>

          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Common money problems feel bigger when there is no clear system
            </Text>
            <View style={{ gap: Spacing.md }}>
              {PROBLEMS.map((problem) => (
                <SectionCard key={problem}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        backgroundColor: colors.primaryBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.primary} />
                    </View>
                    <Text style={{ flex: 1, fontSize: Typography.fontSize.md, lineHeight: 24, color: colors.textPrimary }}>
                      {problem}
                    </Text>
                  </View>
                </SectionCard>
              ))}
            </View>
          </View>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              MoneyKai helps turn those problems into a more manageable routine
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.md, lineHeight: 26, color: colors.textSecondary }}>
              MoneyKai helps users track expenses, manage budgets, organize shared money, monitor savings, understand spending patterns, and stay prepared for financial emergencies.
            </Text>
          </SectionCard>

          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Feature preview
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
              {PUBLIC_FEATURES.map((feature) => (
                <Link key={feature.slug} href={`/features/${feature.slug}` as const} asChild>
                  <TouchableOpacity activeOpacity={0.82} style={{ flexBasis: 280, flexGrow: 1 }}>
                    <SectionCard>
                      <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        {feature.title}
                      </Text>
                      <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                        {feature.description}
                      </Text>
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          marginTop: Spacing.md,
                          paddingHorizontal: Spacing.md,
                          paddingVertical: 10,
                          borderRadius: BorderRadius.full,
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: colors.borderLight,
                        }}
                      >
                        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                          Open feature
                        </Text>
                      </View>
                    </SectionCard>
                  </TouchableOpacity>
                </Link>
              ))}

              <Link href="/financial-first-aid" asChild>
                <TouchableOpacity activeOpacity={0.82} style={{ flexBasis: 280, flexGrow: 1 }}>
                  <SectionCard>
                    <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      Financial First Aid
                    </Text>
                    <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                      A calmer way to respond to money stress with clearer next steps, protected essentials, and less panic.
                    </Text>
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        marginTop: Spacing.md,
                        paddingHorizontal: Spacing.md,
                        paddingVertical: 10,
                        borderRadius: BorderRadius.full,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.borderLight,
                      }}
                    >
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        Open feature
                      </Text>
                    </View>
                  </SectionCard>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Security and trust preview
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
              MoneyKai’s trust layer explains how secure login, clear data handling, backup continuity, and privacy-first thinking fit into the product experience.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg }}>
              {TRUST_POINTS.map((item) => (
                <View
                  key={item}
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
                    {item}
                  </Text>
                </View>
              ))}
            </View>
            <Link href="/security" asChild>
              <TouchableOpacity
                activeOpacity={0.82}
                style={{
                  alignSelf: 'flex-start',
                  marginTop: Spacing.lg,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 12,
                  borderRadius: BorderRadius.full,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Visit security page
                </Text>
              </TouchableOpacity>
            </Link>
          </SectionCard>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Learn better money habits
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
              Simple guides on budgeting, saving money, tracking expenses, and personal finance habits.
            </Text>
            <Link href="/learn" asChild>
              <TouchableOpacity
                activeOpacity={0.82}
                style={{
                  alignSelf: 'flex-start',
                  marginTop: Spacing.lg,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 12,
                  borderRadius: BorderRadius.full,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Explore Learn
                </Text>
              </TouchableOpacity>
            </Link>
          </SectionCard>

          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Frequently asked questions
            </Text>
            <View style={{ gap: Spacing.md }}>
              {HOME_FAQS.map((faq) => (
                <SectionCard key={faq.question}>
                  <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {faq.question}
                  </Text>
                  <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                    {faq.answer}
                  </Text>
                </SectionCard>
              ))}
            </View>
            <Link href="/faq" asChild>
              <TouchableOpacity
                activeOpacity={0.82}
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 12,
                  borderRadius: BorderRadius.full,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  View full FAQ
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Start managing your money with clarity
            </Text>
            <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.sm, marginTop: Spacing.lg }}>
              <Button
                title="Get Started"
                onPress={() => router.push('/(auth)/signup')}
                size="lg"
                style={{ minWidth: isWide ? 180 : '100%' }}
              />
              <Button
                title="Explore MoneyKai Learn"
                onPress={() => router.push('/learn')}
                size="lg"
                variant="outline"
                style={{ minWidth: isWide ? 220 : '100%' }}
              />
            </View>
          </SectionCard>
        </View>
      </PublicShell>
    </>
  );
}
