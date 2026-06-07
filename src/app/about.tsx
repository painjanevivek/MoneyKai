import Head from 'expo-router/head';
import { Link } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const AUDIENCE = [
  'Students',
  'Beginners in personal finance',
  'Individuals tracking daily spending',
  'Friends or roommates managing shared costs',
  'Families organizing household expenses',
];

const FOCUS_AREAS = [
  'Simplicity',
  'Clarity',
  'Daily usefulness',
  'Shared finance organization',
  'Privacy and trust',
];

export default function AboutPage() {
  const { colors } = useTheme();

  return (
    <>
      <Head>
        <title>About MoneyKai | Simple Personal Finance for Everyday Life</title>
        <meta
          name="description"
          content="Learn what MoneyKai is, why it exists, who it is for, and how it helps people track expenses, manage budgets, and organize shared spending."
        />
        <meta
          name="keywords"
          content="about MoneyKai, personal finance app, budget app, expense tracking app, shared spending app"
        />
        <meta property="og:title" content="About MoneyKai" />
        <meta
          property="og:description"
          content="MoneyKai is a simple personal finance app built to help people track expenses, manage budgets, organize shared spending, and build better money habits."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About MoneyKai" />
        <meta
          name="twitter:description"
          content="MoneyKai is a simple personal finance app built to help people track expenses, manage budgets, organize shared spending, and build better money habits."
        />
        <link rel="canonical" href="https://moneykai.com/about" />
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
                  About MoneyKai
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
                About MoneyKai
              </Text>

              <Text
                style={{
                  marginTop: Spacing.lg,
                  maxWidth: 800,
                  fontSize: Typography.fontSize.md,
                  lineHeight: Typography.lineHeight.md,
                  color: colors.textSecondary,
                }}
              >
                MoneyKai is a simple personal finance app built to help people track expenses, manage budgets, organize shared spending, and build better money habits.
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: colors.borderLight,
                padding: Spacing.xl,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize['2xl'],
                  lineHeight: Typography.lineHeight['2xl'],
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.textPrimary,
                  marginBottom: Spacing.sm,
                }}
              >
                Mission
              </Text>
              <Text
                style={{
                  fontSize: Typography.fontSize.base,
                  lineHeight: Typography.lineHeight.base,
                  color: colors.textSecondary,
                  maxWidth: 760,
                }}
              >
                Make money management simple, clear, and less stressful.
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
                Who It Is For
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
                {AUDIENCE.map((item) => (
                  <View
                    key={item}
                    style={{
                      flexBasis: 320,
                      flexGrow: 1,
                      backgroundColor: colors.surface,
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
                      {item}
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
                What MoneyKai Focuses On
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
                {FOCUS_AREAS.map((item, index) => (
                  <View
                    key={item}
                    style={{
                      flexBasis: 200,
                      flexGrow: 1,
                      backgroundColor: colors.card,
                      borderRadius: BorderRadius.xl,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                      padding: Spacing.lg,
                    }}
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: Spacing.md,
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
                        fontSize: Typography.fontSize.md,
                        lineHeight: Typography.lineHeight.md,
                        fontFamily: Typography.fontFamily.medium,
                        color: colors.textPrimary,
                      }}
                    >
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
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
                  fontSize: Typography.fontSize['2xl'],
                  lineHeight: Typography.lineHeight['2xl'],
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.textPrimary,
                  marginBottom: Spacing.sm,
                }}
              >
                Start using MoneyKai
              </Text>
              <Text
                style={{
                  fontSize: Typography.fontSize.base,
                  lineHeight: Typography.lineHeight.base,
                  color: colors.textSecondary,
                  marginBottom: Spacing.md,
                }}
              >
                Start using MoneyKai to track spending, stay organized, and build better money habits over time.
              </Text>
              <Link href="/(auth)/signup" style={{ color: colors.primary, fontFamily: Typography.fontFamily.semiBold }}>
                Start using MoneyKai
              </Link>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
