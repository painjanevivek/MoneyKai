import React from 'react';
import { Link, Redirect, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Button } from '@/components/ui/Button';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { LEARN_ARTICLES } from '@/content/learn';
import { SITE } from '@/constants/site';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';

const POSITIONING = [
  {
    title: 'See spending clearly',
    body: 'Dashboard, transactions, and analytics help people understand what is happening before they try to fix it.',
    icon: 'chart-line',
  },
  {
    title: 'Handle shared money calmly',
    body: 'Groups and shared expense flows help couples, roommates, families, and small teams stay aligned.',
    icon: 'account-group-outline',
  },
  {
    title: 'Stay steady when money gets stressful',
    body: 'MoneyKai reframes emergency support into financial first aid with practical next steps and continuity tools.',
    icon: 'lifebuoy',
  },
];

const TRUST_ITEMS = [
  'Public trust and security pages',
  'Privacy policy in plain language',
  'Backup and restore support',
  'Original Learn content for discovery',
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
      <PublicShell
        eyebrow="Personal finance and budgeting"
        title="MoneyKai gives personal finance a calmer public face and a stronger everyday workflow."
        description="Budgeting, analytics, groups, savings, transactions, notes, backups, settings, and financial first aid come together in one product that explains itself clearly before signup."
      >
        <View style={{ gap: Spacing.xl }}>
          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
            <SectionCard style={{ flex: 1.2 }}>
              <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                Better public positioning
              </Text>
              <Text style={{ marginTop: 10, fontSize: Typography.fontSize.md, lineHeight: 24, color: colors.textSecondary }}>
                MoneyKai is not just a collection of product screens. It is a budgeting and personal finance app with a clear public website, stronger trust layer, helpful onboarding, and original educational content.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg }}>
                {TRUST_ITEMS.map((item) => (
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
              <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.sm, marginTop: Spacing.lg }}>
                <Button
                  title="Create account"
                  onPress={() => router.push('/(auth)/signup')}
                  size="lg"
                  style={{ minWidth: isWide ? 180 : '100%' }}
                />
                <Button
                  title="Sign in"
                  onPress={() => router.push('/(auth)/login')}
                  size="lg"
                  variant="outline"
                  style={{ minWidth: isWide ? 160 : '100%' }}
                />
              </View>
            </SectionCard>

            <SectionCard style={{ flex: 0.9 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                QUICK POSITIONING
              </Text>
              <View style={{ marginTop: Spacing.md, gap: Spacing.md }}>
                {[
                  'Personal finance and budget management',
                  'Web and mobile friendly route structure',
                  'Trust pages that support conversion',
                  'Discoverability through original Learn content',
                ].map((line) => (
                  <View key={line} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.primary} />
                    <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                      {line}
                    </Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          </View>

          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
            {POSITIONING.map((item) => (
              <SectionCard key={item.title} style={{ flex: 1 }}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 16,
                    backgroundColor: colors.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: Spacing.md,
                  }}
                >
                  <MaterialCommunityIcons name={item.icon as any} size={22} color={colors.primary} />
                </View>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {item.title}
                </Text>
                <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  {item.body}
                </Text>
              </SectionCard>
            ))}
          </View>

          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
            {[
              {
                title: 'Start in three steps',
                body: 'Create an account, add your real money picture, and let the dashboard show what needs attention first.',
                href: '/how-it-works' as const,
              },
              {
                title: 'See the trust layer',
                body: 'Open the privacy, security, and trust pages before signup to understand how MoneyKai handles finance data and continuity.',
                href: '/trust' as const,
              },
              {
                title: 'Read original Learn content',
                body: 'MoneyKai Learn focuses on budgeting, shared expenses, and recovery topics connected to real product use cases.',
                href: '/learn' as any,
              },
            ].map((item) => (
              <Link key={item.href} href={item.href} asChild>
                <TouchableOpacity activeOpacity={0.82} style={{ flex: 1 }}>
                  <SectionCard>
                    <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      {item.title}
                    </Text>
                    <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                      {item.body}
                    </Text>
                  </SectionCard>
                </TouchableOpacity>
              </Link>
            ))}
          </View>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              MoneyKai Learn
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
              Original content gives the product a more durable SEO foundation than thin feature copy or scraped articles.
            </Text>
            <View style={{ marginTop: Spacing.lg, gap: Spacing.md }}>
              {LEARN_ARTICLES.map((article) => (
                <Link key={article.slug} href={`/learn/${article.slug}` as any} asChild>
                  <TouchableOpacity activeOpacity={0.82}>
                    <View
                      style={{
                        paddingBottom: Spacing.md,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderLight,
                      }}
                    >
                      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                        {article.category} · {article.readTime}
                      </Text>
                      <Text style={{ marginTop: 6, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        {article.title}
                      </Text>
                      <Text style={{ marginTop: 8, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                        {article.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </SectionCard>
        </View>
      </PublicShell>
    </>
  );
}
