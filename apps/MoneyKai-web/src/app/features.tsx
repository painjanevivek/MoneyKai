import React from 'react';
import { Link, router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const FEATURE_CARDS = [
  {
    title: 'Expense Tracking',
    description:
      'Track daily spending in one place so it is easier to see where money goes and what habits need attention. MoneyKai helps turn scattered purchases into a clearer financial record you can actually use.',
    href: '/features/expense-tracking' as const,
  },
  {
    title: 'Budgeting',
    description:
      'Manage monthly budgets with a structure that feels practical for everyday life. MoneyKai helps users stay aware of limits, adjust sooner, and build better money routines over time.',
    href: '/features/budgeting' as const,
  },
  {
    title: 'Groups / Shared Expenses',
    description:
      'Organize shared money for couples, roommates, families, friends, or other small groups. MoneyKai keeps shared costs more visible so money conversations feel less confusing and easier to trust.',
    href: '/features/groups' as const,
  },
  {
    title: 'Savings',
    description:
      'Keep savings progress visible instead of letting goals fade into the background. MoneyKai helps connect saving habits with the rest of your financial picture so progress feels more consistent.',
    href: '/features/savings' as const,
  },
  {
    title: 'Analytics',
    description:
      'Review spending patterns and category trends so your financial habits are easier to understand. MoneyKai turns transaction history into useful insight for smarter monthly decisions.',
    href: '/features/analytics' as const,
  },
  {
    title: 'Encrypted Backup Files',
    description:
      'Create password-encrypted JSON backup files and restore from files you select. The current Android release does not use Firebase or cloud backup.',
    href: '/features/backup-restore' as const,
  },
  {
    title: 'Financial First Aid',
    description:
      'Handle stressful money moments with a calmer framework focused on clarity, essentials, and next steps. MoneyKai reframes emergency support into something practical instead of alarm-heavy.',
    href: '/financial-first-aid' as const,
  },
];

export default function FeaturesScreen() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title="MoneyKai Features | Explore expense tracking, budgeting, savings, analytics, and more"
        description="Explore MoneyKai features for local expense tracking, budgeting, shared expenses, savings, analytics, encrypted backup files, and financial first aid."
        path="/features"
        keywords={['MoneyKai features', 'expense tracking app', 'budgeting app', 'shared expenses app', 'personal finance features']}
      />
      <PublicShell
        eyebrow="Features"
        title="MoneyKai Features"
        description="Explore the tools the current Android release gives you to track expenses, manage budgets, organize shared money, monitor savings, and understand your financial habits locally."
      >
        <View style={{ gap: Spacing.xl }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
            {FEATURE_CARDS.map((feature) => (
              <SectionCard key={feature.title} style={{ flexBasis: 280, flexGrow: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {feature.title}
                </Text>
                <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  {feature.description}
                </Text>
                <Link href={feature.href} asChild>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: Spacing.md,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: 12,
                      borderRadius: BorderRadius.full,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      Explore feature
                    </Text>
                  </TouchableOpacity>
                </Link>
              </SectionCard>
            ))}
          </View>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Ready to organize your money?
            </Text>
            <View style={{ marginTop: Spacing.lg }}>
              <Button
                title="Get Started"
                onPress={() => router.push('/(auth)/signup')}
                size="lg"
                style={{ alignSelf: 'flex-start' }}
              />
            </View>
          </SectionCard>
        </View>
      </PublicShell>
    </>
  );
}
