import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View, useWindowDimensions } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const STEPS = [
  {
    title: 'Start with your real money picture',
    description: 'Create an account, add the basics, and look at the dashboard before trying to optimize everything at once.',
    icon: 'compass-outline',
  },
  {
    title: 'Track the flow that matters',
    description: 'Use transactions, notes, analytics, and savings views to understand what is recurring, what is optional, and what needs attention.',
    icon: 'swap-horizontal',
  },
  {
    title: 'Add shared spaces when needed',
    description: 'If money is managed with someone else, use groups and shared expense visibility instead of scattered messages or memory.',
    icon: 'account-group-outline',
  },
  {
    title: 'Protect continuity',
    description: 'Use settings, backups, restore, and privacy controls so your financial record stays usable over time.',
    icon: 'cloud-sync-outline',
  },
];

export default function HowItWorksScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  return (
    <>
      <SeoHead
        title="How MoneyKai Works | A calmer onboarding path for budgeting and personal finance"
        description="See how MoneyKai helps people begin with visibility, track spending, handle shared expenses, and build recovery habits without overwhelming onboarding."
        path="/how-it-works"
        keywords={['budget app onboarding', 'how budgeting apps work', 'personal finance workflow']}
      />
      <PublicShell
        eyebrow="Onboarding"
        title="MoneyKai is designed to onboard people into clarity, not pressure."
        description="The goal is not to force a perfect setup on day one. The goal is to help people move from uncertainty to a stable money routine they can keep."
      >
        <View style={{ gap: Spacing.md }}>
          {STEPS.map((step, index) => (
            <SectionCard key={step.title}>
              <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
                <View
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    backgroundColor: colors.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name={step.icon as any} size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                    STEP {index + 1}
                  </Text>
                  <Text style={{ marginTop: 6, fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {step.title}
                  </Text>
                  <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                    {step.description}
                  </Text>
                </View>
              </View>
            </SectionCard>
          ))}
        </View>
      </PublicShell>
    </>
  );
}
