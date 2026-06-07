import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const BENEFITS = [
  'Set a monthly budget',
  'Track spending against budget',
  'Manage allowance',
  'Understand remaining balance',
  'Build a repeatable monthly routine',
];

const USE_CASES = [
  'Monthly personal budgeting',
  'Student allowance management',
  'Household budget tracking',
  'Beginner-friendly budget planning',
];

const FAQS = [
  {
    question: 'Can I set a monthly budget in MoneyKai?',
    answer:
      'Yes. MoneyKai helps users define a monthly budget so they can stay aware of how much they plan to spend and how spending changes through the month.',
  },
  {
    question: 'Does MoneyKai help with allowance management?',
    answer:
      'Yes. The budgeting flow can support allowance-style planning by helping users keep a visible limit, review spending, and understand what remains available.',
  },
  {
    question: 'Why is remaining balance important?',
    answer:
      'Seeing the remaining balance makes decisions easier because users do not have to guess how much room is left. It helps turn budgeting into an everyday guide instead of a once-a-month setup.',
  },
  {
    question: 'Is MoneyKai good for beginner budgeting?',
    answer:
      'Yes. The budgeting experience is meant to feel approachable for users who want a clearer monthly routine without needing advanced finance knowledge.',
  },
];

export default function BudgetingFeaturePage() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title="Budgeting Made Simple | MoneyKai budgeting and allowance management"
        description="Set monthly budgets, manage allowance, reset monthly limits, and stay aware of how much you can spend with MoneyKai."
        path="/features/budgeting"
        keywords={['budgeting app', 'monthly budget planner', 'allowance management app', 'beginner budgeting']}
      />
      <PublicShell
        eyebrow="Budgeting"
        title="Budgeting Made Simple"
        description="Set monthly budgets, manage allowance, reset monthly limits, and stay aware of how much you can spend."
      >
        <View style={{ gap: Spacing.xl }}>
          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Key benefits
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
              {BENEFITS.map((benefit) => (
                <SectionCard key={benefit} style={{ flexBasis: 240, flexGrow: 1 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      backgroundColor: colors.primaryBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: Spacing.md,
                    }}
                  >
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={{ fontSize: Typography.fontSize.md, lineHeight: 22, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                    {benefit}
                  </Text>
                </SectionCard>
              ))}
            </View>
          </View>

          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Use cases
            </Text>
            <View style={{ gap: Spacing.md }}>
              {USE_CASES.map((useCase, index) => (
                <SectionCard key={useCase}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: Typography.fontSize.md, lineHeight: 22, color: colors.textPrimary }}>
                      {useCase}
                    </Text>
                  </View>
                </SectionCard>
              ))}
            </View>
          </View>

          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Frequently asked questions
            </Text>
            <View style={{ gap: Spacing.md }}>
              {FAQS.map((faq) => (
                <SectionCard key={faq.question}>
                  <Text style={{ fontSize: Typography.fontSize.lg, lineHeight: 24, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {faq.question}
                  </Text>
                  <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                    {faq.answer}
                  </Text>
                </SectionCard>
              ))}
            </View>
          </View>
        </View>
      </PublicShell>
    </>
  );
}
