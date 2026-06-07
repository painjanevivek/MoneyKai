import React from 'react';
import { Link } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function PricingPage() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title="MoneyKai Pricing | Clear, simple public pricing information"
        description="Read MoneyKai pricing information and see how the product currently presents access without a complicated public pricing structure."
        path="/pricing"
        keywords={['MoneyKai pricing', 'budget app pricing', 'personal finance app pricing']}
      />
      <PublicShell
        eyebrow="Pricing"
        title="Simple pricing information is better than a confusing pricing wall."
        description="MoneyKai’s public website should explain pricing clearly. At this stage, the product does not rely on aggressive upsell messaging or a cluttered pricing ladder."
      >
        <View style={{ gap: Spacing.md }}>
          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Current public access
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize['3xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Free to get started
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              MoneyKai currently presents a simple entry point for users who want to explore expense tracking, budgeting, groups, savings, analytics, backups, and the broader trust layer without navigating complicated plan decisions first.
            </Text>
          </SectionCard>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
            {[
              'No aggressive pricing ladder on the public homepage',
              'Clear route for product exploration before signup',
              'Focus on usefulness, trust, and clarity first',
            ].map((point) => (
              <SectionCard key={point} style={{ flexBasis: 260, flexGrow: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.md, lineHeight: 22, color: colors.textPrimary }}>
                  {point}
                </Text>
              </SectionCard>
            ))}
          </View>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Explore the product first
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              Users usually want to understand the product, the trust layer, and the feature set before they care about future pricing changes. MoneyKai’s public structure is built around that order.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg }}>
              {[
                { href: '/features' as const, label: 'Explore features' },
                { href: '/security' as const, label: 'Read security page' },
                { href: '/learn' as const, label: 'Visit Learn' },
              ].map((item) => (
                <Link key={item.href} href={item.href as any} asChild>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={{
                      paddingHorizontal: Spacing.md,
                      paddingVertical: 12,
                      borderRadius: BorderRadius.full,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      {item.label}
                    </Text>
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
