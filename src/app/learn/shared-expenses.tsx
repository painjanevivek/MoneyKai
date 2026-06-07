import React from 'react';
import { Text, View } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function SharedExpensesArticleScreen() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title="How to manage shared expenses without creating tension | MoneyKai Learn"
        description="A practical guide for couples, roommates, and families to manage shared expenses with more clarity and less money friction."
        path="/learn/shared-expenses"
        keywords={['shared expenses', 'split bills', 'couples budgeting', 'roommate expenses']}
      />
      <PublicShell
        eyebrow="MoneyKai Learn"
        title="How to manage shared expenses without creating tension"
        description="Shared money becomes stressful when people rely on memory, vague expectations, or scattered messages. Clarity reduces conflict."
      >
        <View style={{ gap: Spacing.md }}>
          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Define the system before the next bill arrives
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              The best time to agree on shared expense rules is before the next awkward payment. Decide what counts as shared, what remains personal, and how each payment gets recorded. A small system saves a surprising amount of emotional energy.
            </Text>
          </SectionCard>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Visibility matters more than complexity
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              Most households do not need a complicated formula. They need a place where each person can see who paid, what it covered, and whether anything still needs to be settled. That is why group-based views are so helpful for real shared costs.
            </Text>
          </SectionCard>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Keep the conversation practical
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              When shared expenses are visible, conversations can stay focused on decisions instead of accusations. The goal is not perfect equality in every tiny moment. The goal is a trusted record that makes the next decision easier.
            </Text>
          </SectionCard>
        </View>
      </PublicShell>
    </>
  );
}
