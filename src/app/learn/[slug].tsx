import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { getLearnArticleBySlug, getRelatedLearnArticles } from '@/data/learnArticles';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { LearnArticleTemplate } from '@/components/marketing/LearnArticleTemplate';

export default function LearnArticlePage() {
  const { colors } = useTheme();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const article = slug ? getLearnArticleBySlug(slug) : undefined;

  if (!article) {
    return (
      <>
      <SeoHead
          title="MoneyKai Learn | Article not found"
          description="The requested MoneyKai Learn article could not be found."
          path="/learn"
        />
        <PublicShell eyebrow="MoneyKai Learn" title="Article not found" description="The page you requested does not exist. Browse the Learn hub to find a relevant guide.">
          <SectionCard style={{ gap: Spacing.sm }}>
            <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              We could not find that article.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/learn' as any)}
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.full,
                backgroundColor: colors.primary,
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                Back to Learn
              </Text>
            </TouchableOpacity>
          </SectionCard>
        </PublicShell>
      </>
    );
  }

  return <LearnArticleTemplate article={article} relatedArticles={getRelatedLearnArticles(article.slug)} />;
}
