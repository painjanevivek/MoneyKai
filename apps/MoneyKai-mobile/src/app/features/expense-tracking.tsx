import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const BENEFITS = [
  'Add and manage daily expenses',
  'Organize transactions',
  'View spending history',
  'Understand spending behavior',
  'Build better money habits',
];

const USE_CASES = [
  'Students tracking pocket money',
  'Individuals managing monthly spending',
  'Families watching daily household expenses',
  'Anyone trying to stop overspending',
];

const FAQS = [
  {
    question: 'Can I use MoneyKai to track daily expenses?',
    answer:
      'Yes. MoneyKai is designed to help users record day-to-day spending so their money activity stays visible instead of getting lost across memory, notes, or chat messages.',
  },
  {
    question: 'Why is spending history useful?',
    answer:
      'Spending history helps users look back at patterns, notice repeat behavior, and make better decisions based on what actually happened instead of what they assume happened.',
  },
  {
    question: 'Does expense tracking help with overspending?',
    answer:
      'Yes. When spending becomes visible and organized, it is easier to notice pressure points earlier and make small corrections before they turn into bigger problems.',
  },
  {
    question: 'Who benefits most from expense tracking?',
    answer:
      'Students, working individuals, families, and anyone trying to become more intentional with money can benefit from seeing daily expenses in one reliable place.',
  },
];

export default function ExpenseTrackingFeaturePage() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title="Expense Tracking with MoneyKai | Track daily spending and understand where your money goes"
        description="Track your daily spending, organize transactions, and understand where your money goes with MoneyKai expense tracking."
        path="/features/expense-tracking"
        keywords={['expense tracking with MoneyKai', 'daily expense tracker', 'spending history app', 'personal finance tracking']}
      />
      <PublicShell
        eyebrow="Expense Tracking"
        title="Expense Tracking with MoneyKai"
        description="Track your daily spending, organize transactions, and understand where your money goes."
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
