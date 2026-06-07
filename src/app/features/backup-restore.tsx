import Head from 'expo-router/head';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const BENEFITS = [
  'Backup important app data',
  'Restore data when needed',
  'Support account continuity',
  'Reduce risk of losing records',
  'Keep finance tracking consistent',
];

const FAQS = [
  {
    question: 'What does backup and restore do in MoneyKai?',
    answer:
      'Backup and restore helps save supported account data so you can recover it later and continue using MoneyKai with less disruption.',
  },
  {
    question: 'Why is backup useful for finance tracking?',
    answer:
      'It reduces the chance of losing important records and helps keep your budgeting history available when you need it again.',
  },
  {
    question: 'Can backup and restore help when switching devices?',
    answer:
      'Where supported, it is designed to help you continue across sessions or devices by reconnecting to account-based saved data.',
  },
  {
    question: 'Does restore bring back everything instantly?',
    answer:
      'Restore behavior depends on what data is supported, but the goal is to help you recover key information and continue tracking smoothly.',
  },
];

export default function BackupRestoreFeaturePage() {
  const { colors } = useTheme();

  return (
    <>
      <Head>
        <title>MoneyKai Backup and Restore | Keep Your Data Safer</title>
        <meta
          name="description"
          content="Learn how MoneyKai backup and restore helps keep your data safer, supports account continuity, and helps reduce the risk of losing records."
        />
        <meta
          name="keywords"
          content="MoneyKai backup, MoneyKai restore, backup and restore, finance data backup, account continuity"
        />
        <meta property="og:title" content="Backup and Restore Your MoneyKai Data" />
        <meta
          property="og:description"
          content="Keep your MoneyKai data safer with account-based backup and restore support."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Backup and Restore Your MoneyKai Data" />
        <meta
          name="twitter:description"
          content="Keep your MoneyKai data safer with account-based backup and restore support."
        />
        <link rel="canonical" href="https://moneykai.com/features/backup-restore" />
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
                  Backup and Restore
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
                Backup and Restore Your MoneyKai Data
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
                Keep your MoneyKai data safer with account-based backup and restore support.
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
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.textPrimary,
                  marginBottom: Spacing.md,
                }}
              >
                Trust Note
              </Text>
              <Text
                style={{
                  fontSize: Typography.fontSize.base,
                  lineHeight: Typography.lineHeight.base,
                  color: colors.textSecondary,
                  maxWidth: 820,
                }}
              >
                Backup and restore is designed to help users keep continuity across sessions and devices where support is available. The goal is simple: make it easier to recover important data and continue using MoneyKai with less interruption.
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
