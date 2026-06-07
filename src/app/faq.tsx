import Head from 'expo-router/head';
import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type FaqItem = {
  question: string;
  answer: string;
};

type FaqCategory = {
  title: string;
  items: FaqItem[];
};

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: 'General',
    items: [
      {
        question: 'What is MoneyKai?',
        answer:
          'MoneyKai is a personal finance app built to help users track expenses, manage budgets, organize shared spending, and build better money habits.',
      },
      {
        question: 'Who is MoneyKai for?',
        answer:
          'MoneyKai is designed for students, beginners in personal finance, individuals tracking daily spending, friends or roommates sharing costs, and families organizing household expenses.',
      },
      {
        question: 'Is MoneyKai free?',
        answer:
          'The current project does not show a paid plan or subscription flow. It also supports a demo mode locally when cloud features are not configured.',
      },
    ],
  },
  {
    title: 'Account and login',
    items: [
      {
        question: 'How do I create an account?',
        answer:
          'You can create an account from the sign-up screen by entering your name, email address, and password.',
      },
      {
        question: 'Can I log in with Google?',
        answer:
          'Yes, Google sign-in is available on web when Firebase authentication is configured. The current project notes that native Google sign-in is not yet set up for mobile.',
      },
      {
        question: 'What should I do if I forget my password?',
        answer:
          'Use the forgot password option on the login screen. Password reset email support depends on Firebase being configured for the project.',
      },
    ],
  },
  {
    title: 'Expense tracking',
    items: [
      {
        question: 'Can I track daily expenses?',
        answer:
          'Yes. MoneyKai includes transaction tracking so users can add and review everyday spending records.',
      },
      {
        question: 'Can I review old transactions?',
        answer:
          'Yes. The app includes a transactions area where previous records can be reviewed, filtered, and searched.',
      },
    ],
  },
  {
    title: 'Budgeting',
    items: [
      {
        question: 'Can I set a monthly budget?',
        answer:
          'Yes. MoneyKai includes monthly budget settings along with reset preferences and budget health views.',
      },
      {
        question: 'Can I manage allowance?',
        answer:
          'Yes. The app supports a monthly allowance value and related budget adjustments inside the budgeting flow.',
      },
    ],
  },
  {
    title: 'Groups',
    items: [
      {
        question: 'Can I manage shared expenses?',
        answer:
          'Yes. MoneyKai includes groups for shared expense tracking, balances, and split-cost organization.',
      },
      {
        question: 'Who can use groups?',
        answer:
          'Groups are useful for friends, roommates, couples, families, or small shared-cost situations where more than one person needs to track spending together.',
      },
    ],
  },
  {
    title: 'Savings',
    items: [
      {
        question: 'Can I track savings goals?',
        answer:
          'MoneyKai currently focuses on savings projections, challenges, and emergency budgeting. The current project does not show a separate advanced savings-goal system.',
      },
    ],
  },
  {
    title: 'Security and privacy',
    items: [
      {
        question: 'Is my data safe?',
        answer:
          'MoneyKai uses account authentication and supports backup-related storage where configured, but it does not claim absolute security. The project describes its approach in the security and privacy pages without making stronger unverified claims.',
      },
      {
        question: 'Does MoneyKai sell my data?',
        answer:
          'No. The current privacy policy states that MoneyKai does not sell user personal finance data.',
      },
      {
        question: 'How can I contact support?',
        answer:
          'You can contact support through the contact page. The current project uses a simple email-based support path.',
      },
    ],
  },
];

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_CATEGORIES.flatMap((category) =>
    category.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    }))
  ),
};

export default function FaqPage() {
  const { colors } = useTheme();

  return (
    <>
      <Head>
        <title>MoneyKai FAQ | Frequently Asked Questions</title>
        <meta
          name="description"
          content="Read common questions about MoneyKai, including login, budgeting, expense tracking, groups, savings, privacy, and support."
        />
        <meta
          name="keywords"
          content="MoneyKai FAQ, MoneyKai questions, expense tracking help, budgeting app FAQ, MoneyKai support"
        />
        <meta property="og:title" content="Frequently Asked Questions" />
        <meta
          property="og:description"
          content="Read common questions about MoneyKai, including account access, budgets, shared expenses, savings, and privacy."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Frequently Asked Questions" />
        <meta
          name="twitter:description"
          content="Read common questions about MoneyKai, including account access, budgets, shared expenses, savings, and privacy."
        />
        <link rel="canonical" href="https://moneykai.com/faq" />
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
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
                  Help and Answers
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
                Frequently Asked Questions
              </Text>
            </View>

            <View style={{ gap: Spacing.lg }}>
              {FAQ_CATEGORIES.map((category) => (
                <View key={category.title} style={{ gap: Spacing.md }}>
                  <Text
                    style={{
                      fontSize: Typography.fontSize['2xl'],
                      fontFamily: Typography.fontFamily.semiBold,
                      color: colors.textPrimary,
                    }}
                  >
                    {category.title}
                  </Text>

                  <View style={{ gap: Spacing.md }}>
                    {category.items.map((item) => (
                      <View
                        key={item.question}
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
                          {item.question}
                        </Text>
                        <Text
                          style={{
                            fontSize: Typography.fontSize.base,
                            lineHeight: Typography.lineHeight.base,
                            color: colors.textSecondary,
                          }}
                        >
                          {item.answer}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: colors.borderLight,
                padding: Spacing.xl,
                ...Shadows.md,
                shadowColor: colors.shadowColor,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.xl,
                  lineHeight: Typography.lineHeight.xl,
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.textPrimary,
                  marginBottom: Spacing.sm,
                }}
              >
                Need more help?
              </Text>
              <Text
                style={{
                  fontSize: Typography.fontSize.base,
                  lineHeight: Typography.lineHeight.base,
                  color: colors.textSecondary,
                }}
              >
                If your question is not covered here, visit{' '}
                <Link href="/contact" style={{ color: colors.primary, fontFamily: Typography.fontFamily.semiBold }}>
                  /contact
                </Link>
                .
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
