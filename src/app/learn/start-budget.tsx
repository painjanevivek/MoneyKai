import React from 'react';
import { Text, View } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function StartBudgetArticleScreen() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title="How to start a budget when your money changes every month | MoneyKai Learn"
        description="A practical guide to building a flexible budget when income, bills, and spending are not perfectly stable from month to month."
        path="/learn/start-budget"
        keywords={['variable income budget', 'how to start a budget', 'flexible budgeting']}
      />
      <PublicShell
        eyebrow="MoneyKai Learn"
        title="How to start a budget when your money changes every month"
        description="A strict budget can break quickly when income is uneven. A useful budget begins by separating essentials, recurring obligations, and flexible spending."
      >
        <View style={{ gap: Spacing.md }}>
          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Start with the floor, not the ideal
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              Many people try to build a budget around a best-case month. That creates instant friction when the next month looks different. A stronger starting point is your floor: the amount you need to protect housing, food, transport, account access, and minimum commitments.
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              Once the floor is visible, the next step is to group other spending into recurring, occasional, and optional categories. This makes change easier because you are adjusting buckets instead of renegotiating your entire life every month.
            </Text>
          </SectionCard>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              A simple flexible structure
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              Use one view for what must be covered, one for what usually happens, and one for what can expand or contract. A dashboard and transaction history become useful here because they show where adjustments are actually possible instead of where you wish they were possible.
            </Text>
          </SectionCard>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Review patterns, not isolated mistakes
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              One difficult week does not mean the plan failed. The better question is whether the same pressure point appears often. If it does, your budget is teaching you where more space, a savings buffer, or a different spending rhythm is needed.
            </Text>
          </SectionCard>
        </View>
      </PublicShell>
    </>
  );
}
