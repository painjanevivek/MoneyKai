import Head from 'expo-router/head';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const BENEFITS = [
  'View spending breakdowns',
  'Understand where money goes',
  'Identify spending habits',
  'Review financial activity',
  'Make better decisions from simple insights',
];

const USE_CASES = [
  'Monthly spending review',
  'Category-wise spending check',
  'Budget improvement',
  'Habit tracking',
];

const FAQS = [
  {
    question: 'What can I see in MoneyKai Analytics?',
    answer:
      'MoneyKai Analytics helps you review spending patterns, category activity, and overall financial movement in one place.',
  },
  {
    question: 'Does analytics help me manage my budget better?',
    answer:
      'Yes. By showing where your money is going, analytics makes it easier to spot overspending and adjust your budget with confidence.',
  },
  {
    question: 'Can I use analytics for monthly reviews?',
    answer:
      'Absolutely. The page is built around recurring review habits, so you can quickly understand what changed month to month.',
  },
  {
    question: 'Is analytics useful even if I only track a few categories?',
    answer:
      'Yes. Even lightweight tracking can reveal useful patterns, especially when you want to improve consistency or reduce unnecessary spending.',
  },
];

export default function AnalyticsFeaturePage() {
  const { colors } = useTheme();

  return (
    <>
      <Head>
        <title>MoneyKai Analytics | Understand Your Spending Better</title>
        <meta
          name="description"
          content="Explore MoneyKai Analytics to understand spending patterns, review categories, and make better financial decisions with simple insights."
        />
        <meta
          name="keywords"
          content="MoneyKai analytics, spending insights, budget analytics, expense tracking insights, financial habits"
        />
        <meta property="og:title" content="Understand Your Spending with MoneyKai Analytics" />
        <meta
          property="og:description"
          content="See your spending patterns, understand categories, and make better money decisions with MoneyKai Analytics."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Understand Your Spending with MoneyKai Analytics" />
        <meta
          name="twitter:description"
          content="See your spending patterns, understand categories, and make better money decisions with MoneyKai Analytics."
        />
        <link rel="canonical" href="https://moneykai.com/features/analytics" />
      </Head>

      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.xl,
            paddingBottom: Spacing['4xl'],
          }}
        >
          <View style={{ width: '100%', maxWidth: 1080, alignSelf: 'center', gap: Spacing['2xl'] }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 36,
                borderWidth: 1,
                borderColor: colors.borderLight,
                padding: Spacing['2xl'],
                ...Shadows.lg,
                shadowColor: colors.shadowColor,
              }}
            >
              <View
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  borderRadius: BorderRadius.full,
                  backgroundColor: colors.primaryBg,
                  marginBottom: Spacing.lg,
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: colors.textSecondary,
                  }}
                >
                  Spending Insights
                </Text>
              </View>

              <Text
                style={{
                  fontSize: Typography.fontSize['4xl'],
                  lineHeight: Typography.lineHeight['4xl'],
                  fontFamily: Typography.fontFamily.display,
                  color: colors.textPrimary,
                  maxWidth: 760,
                }}
              >
                Understand Your Spending with MoneyKai Analytics
              </Text>

              <Text
                style={{
                  marginTop: Spacing.lg,
                  maxWidth: 720,
                  fontSize: Typography.fontSize.md,
                  lineHeight: Typography.lineHeight.md,
                  color: colors.textSecondary,
                }}
              >
                See your spending patterns, understand categories, and make better money decisions.
              </Text>
            </View>

            <View style={{ gap: Spacing.lg }}>
              <Text
                style={{
                  fontSize: Typography.fontSize['2xl'],
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.textPrimary,
                }}
              >
                Key Benefits
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
                {BENEFITS.map((benefit) => (
                  <View
                    key={benefit}
                    style={{
                      flexBasis: 320,
                      flexGrow: 1,
                      backgroundColor: colors.card,
                      borderRadius: BorderRadius.xl,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                      padding: Spacing.lg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: Typography.fontSize.md,
                        lineHeight: Typography.lineHeight.md,
                        fontFamily: Typography.fontFamily.medium,
                        color: colors.textPrimary,
                      }}
                    >
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ gap: Spacing.lg }}>
              <Text
                style={{
                  fontSize: Typography.fontSize['2xl'],
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.textPrimary,
                }}
              >
                Use Cases
              </Text>

              <View style={{ gap: Spacing.md }}>
                {USE_CASES.map((useCase, index) => (
                  <View
                    key={useCase}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: BorderRadius.xl,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                      padding: Spacing.lg,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Spacing.md,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.primary,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: Typography.fontSize.sm,
                          fontFamily: Typography.fontFamily.semiBold,
                          color: colors.textInverse,
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: Typography.fontSize.md,
                        fontFamily: Typography.fontFamily.medium,
                        color: colors.textPrimary,
                      }}
                    >
                      {useCase}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ gap: Spacing.lg }}>
              <Text
                style={{
                  fontSize: Typography.fontSize['2xl'],
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.textPrimary,
                }}
              >
                Frequently Asked Questions
              </Text>

              <View style={{ gap: Spacing.md }}>
                {FAQS.map((faq) => (
                  <View
                    key={faq.question}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: BorderRadius.xl,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                      padding: Spacing.lg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: Typography.fontSize.lg,
                        lineHeight: Typography.lineHeight.lg,
                        fontFamily: Typography.fontFamily.semiBold,
                        color: colors.textPrimary,
                        marginBottom: Spacing.sm,
                      }}
                    >
                      {faq.question}
                    </Text>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.base,
                        lineHeight: Typography.lineHeight.base,
                        color: colors.textSecondary,
                      }}
                    >
                      {faq.answer}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
