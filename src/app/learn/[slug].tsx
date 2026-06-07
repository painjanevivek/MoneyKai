import Head from 'expo-router/head';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { LEARN_ARTICLES } from '@/content/learn';

export default function LearnArticlePage() {
  const { colors } = useTheme();
  const { slug } = useLocalSearchParams<{ slug?: string }>();

  const article = useMemo(
    () => LEARN_ARTICLES.find((item) => item.slug === slug) ?? LEARN_ARTICLES[0],
    [slug]
  );

  return (
    <>
      <Head>
        <title>{`${article.title} | MoneyKai Learn`}</title>
        <meta name="description" content={article.description} />
        <meta name="keywords" content={article.keywords.join(', ')} />
        <link rel="canonical" href={`https://moneykai.com/learn/${article.slug}`} />
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
          <View style={{ width: '100%', maxWidth: 960, alignSelf: 'center', gap: Spacing.xl }}>
            <TouchableOpacity
              onPress={() => router.push('/learn' as any)}
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.full,
                borderWidth: 1,
                borderColor: colors.borderLight,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium }}>
                Back to Learn
              </Text>
            </TouchableOpacity>

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
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
                  {article.category}
                </Text>
              </View>
              <Text style={{ fontSize: Typography.fontSize['4xl'], lineHeight: Typography.lineHeight['4xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary, maxWidth: 820 }}>
                {article.title}
              </Text>
              <Text style={{ marginTop: Spacing.lg, fontSize: Typography.fontSize.md, lineHeight: Typography.lineHeight.md, color: colors.textSecondary, maxWidth: 820 }}>
                {article.description}
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
              <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
                Why this matters
              </Text>
              <Text style={{ fontSize: Typography.fontSize.base, lineHeight: Typography.lineHeight.base, color: colors.textSecondary }}>
                {article.keywords.join(' • ')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
