import React from 'react';
import { Link } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const AUDIENCE = [
  'Individuals who want a clearer daily money picture',
  'People trying to manage monthly budgets more consistently',
  'Couples, roommates, friends, and families with shared expenses',
  'Users building savings habits and financial first-aid routines',
];

export default function AboutPage() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title="About MoneyKai | Personal finance for everyday life"
        description="Learn what MoneyKai is, who it is for, and how it helps people track expenses, manage budgets, handle shared spending, and build better money habits."
        path="/about"
        keywords={['about MoneyKai', 'personal finance app', 'budget app', 'shared spending app']}
      />
      <PublicShell
        eyebrow="About MoneyKai"
        title="MoneyKai is built to make personal finance feel clearer, calmer, and more usable."
        description="The product exists to help people understand everyday money flow, manage shared costs, stay closer to savings goals, and handle stressful financial moments with more clarity."
      >
        <View style={{ gap: Spacing.md }}>
          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              What MoneyKai focuses on
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              The current MoneyKai Android release combines local expense tracking, budgeting, shared expense organization, savings visibility, analytics, encrypted backup files, and financial first aid in one product. The public-facing website is designed to explain that clearly before install.
            </Text>
          </SectionCard>

          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Who it is for
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
              {AUDIENCE.map((item) => (
                <SectionCard key={item} style={{ flexBasis: 260, flexGrow: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.md, lineHeight: 22, color: colors.textPrimary }}>
                    {item}
                  </Text>
                </SectionCard>
              ))}
            </View>
          </View>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Why the website matters
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              A finance product should not force people to install before they understand what it does, how it handles trust, or whether it fits their situation. The MoneyKai public site is meant to be a clear front door, not a thin marketing wrapper.
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
