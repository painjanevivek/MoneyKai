import React from 'react';
import { Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const FEATURE_GROUPS = [
  {
    title: 'Daily money clarity',
    description: 'Track transactions, view your dashboard, review trends, and keep notes tied to real money decisions.',
    icon: 'chart-line',
    bullets: ['Dashboard overview', 'Transaction tracking', 'Analytics and trend views', 'Quick notes and reminders'],
  },
  {
    title: 'Shared money without chaos',
    description: 'Groups help you manage split costs and shared responsibilities without losing context about who paid what.',
    icon: 'account-group-outline',
    bullets: ['Group expense spaces', 'Shared cost visibility', 'Simple accountability', 'Useful for couples, families, or roommates'],
  },
  {
    title: 'Savings and recovery planning',
    description: 'Savings features and financial first-aid workflows help you move from reaction mode toward stability.',
    icon: 'shield-check-outline',
    bullets: ['Savings tracking', 'Goal progress', 'Emergency planning mindset', 'Practical next-step prompts'],
  },
  {
    title: 'Private account foundation',
    description: 'MoneyKai includes Firebase authentication, account settings, and backup and restore support for continuity.',
    icon: 'lock-outline',
    bullets: ['Firebase auth', 'Profile and settings', 'Backup and restore', 'Privacy policy and trust pages'],
  },
];

export default function FeaturesScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  return (
    <>
      <SeoHead
        title="MoneyKai Features | Budgeting, shared expenses, notes, backups, and savings"
        description="Explore MoneyKai features for budgeting, analytics, shared expenses, savings, notes, backups, settings, and financial-first-aid planning."
        path="/features"
        keywords={['budget management app', 'shared expenses app', 'personal finance dashboard', 'backup and restore budgeting']}
      />
      <PublicShell
        eyebrow="Feature overview"
        title="A personal finance app that explains what it actually helps you do."
        description="MoneyKai is built around everyday money visibility, shared expense coordination, savings progress, and practical recovery steps when life gets messy."
      >
        <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md, flexWrap: 'wrap' }}>
          {FEATURE_GROUPS.map((item) => (
            <SectionCard key={item.title} style={{ flex: 1, minWidth: isWide ? 250 : undefined }}>
              <View
                style={{
                  width: 48,
                  height: 48,
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
                {item.description}
              </Text>
              <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
                {item.bullets.map((bullet) => (
                  <View key={bullet} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.primary} />
                    <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
                      {bullet}
                    </Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          ))}
        </View>

        <View style={{ marginTop: Spacing.xl }}>
          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Looking for the trust side too?
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
              Features matter, but so does confidence. The trust layer explains privacy, backups, security expectations, and how MoneyKai frames financial first aid.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg }}>
              {[
                { href: '/trust' as const, label: 'Open trust overview' },
                { href: '/security' as const, label: 'Read security page' },
                { href: '/financial-first-aid' as const, label: 'See financial first aid' },
              ].map((item) => (
                <Link key={item.href} href={item.href} asChild>
                  <TouchableOpacity
                    activeOpacity={0.8}
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
