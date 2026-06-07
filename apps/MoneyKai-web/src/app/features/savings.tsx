import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const BENEFITS = [
  'Track savings goals',
  'Monitor progress',
  'Stay motivated',
  'Connect saving habits with daily spending awareness',
  'Build financial discipline',
];

const USE_CASES = [
  'Emergency savings',
  'Student savings',
  'Monthly savings goals',
  'Short-term personal goals',
];

const FAQS = [
  {
    question: 'Can I track savings goals with MoneyKai?',
    answer:
      'Yes. MoneyKai helps users keep savings goals visible so they can stay more aware of progress and make better decisions around day-to-day spending.',
  },
  {
    question: 'Why does savings tracking matter?',
    answer:
      'Savings tracking makes progress easier to see, which helps users stay motivated and continue building habits instead of relying only on intention.',
  },
  {
    question: 'Does savings tracking connect with spending awareness?',
    answer:
      'Yes. When users can see both their savings goals and their daily spending behavior, it becomes easier to understand the trade-offs behind financial decisions.',
  },
  {
    question: 'Who is this useful for?',
    answer:
      'Savings tracking is useful for students, working individuals, people building emergency funds, and anyone trying to stay more consistent with short-term or monthly savings goals.',
  },
];

export default function SavingsFeaturePage() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title="Track Savings and Build Better Money Habits | MoneyKai savings tracking"
        description="Use MoneyKai to monitor savings goals and stay aware of your progress with clearer savings tracking and habit support."
        path="/features/savings"
        keywords={['savings tracker app', 'track savings goals', 'emergency savings app', 'personal savings habits']}
      />
      <PublicShell
        eyebrow="Savings"
        title="Track Savings and Build Better Money Habits"
        description="Use MoneyKai to monitor savings goals and stay aware of your progress."
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
