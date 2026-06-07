import React from 'react';
import { Link } from 'expo-router';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import {
  LEARN_ARTICLES,
  LEARN_CATEGORIES,
  getFeaturedLearnArticles,
  getLatestLearnArticles,
  getLearnArticlesByCategorySlug,
} from '@/data/learnArticles';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function LearnIndexScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const featuredArticles = getFeaturedLearnArticles();
  const latestArticles = getLatestLearnArticles(4);

  return (
    <>
      <SeoHead
        title="MoneyKai Learn | Original personal finance guidance for budgeting, shared money, and recovery"
        description="MoneyKai Learn is an original content section with practical guides on budgeting, shared expenses, emergency planning, and calmer money routines."
        path="/learn"
        keywords={['personal finance articles', 'budgeting guides', 'shared expense advice', 'MoneyKai Learn']}
      />
      <PublicShell
        eyebrow="MoneyKai Learn"
        title="Practical, indexable finance content built around the real questions people have."
        description="MoneyKai Learn avoids scraped content and filler. It focuses on budgeting, expense tracking, saving, shared money, and the small decisions that actually show up in real life."
      >
        <View style={{ gap: Spacing['2xl'] }}>
          <SectionCard variant="elevated" borderRadius="2xl" style={{ gap: Spacing.sm }}>
            <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Featured articles
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary, maxWidth: 760 }}>
              The strongest starting points for people who want practical guidance without noise.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.sm }}>
              {featuredArticles.map((article) => (
                <Link key={article.slug} href={`/learn/${article.slug}` as any} asChild>
                  <TouchableOpacity activeOpacity={0.82} style={{ flexGrow: 1, flexBasis: isWide ? 300 : '100%' }}>
                    <SectionCard style={{ gap: 8, minHeight: 180 }}>
                      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                        {article.category} · {article.readingTime}
                      </Text>
                      <Text style={{ fontSize: Typography.fontSize.lg, lineHeight: 24, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        {article.title}
                      </Text>
                      <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                        {article.excerpt}
                      </Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: 'auto' }}>
                        {article.keywords.slice(0, 3).map((keyword) => (
                          <View
                            key={keyword}
                            style={{
                              paddingHorizontal: Spacing.sm,
                              paddingVertical: 6,
                              borderRadius: BorderRadius.full,
                              backgroundColor: colors.surface,
                              borderWidth: 1,
                              borderColor: colors.borderLight,
                            }}
                          >
                            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{keyword}</Text>
                          </View>
                        ))}
                      </View>
                    </SectionCard>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </SectionCard>

          <View style={{ gap: Spacing.sm }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Latest articles
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
              {latestArticles.map((article) => (
                <Link key={article.slug} href={`/learn/${article.slug}` as any} asChild>
                  <TouchableOpacity activeOpacity={0.82} style={{ flexGrow: 1, flexBasis: isWide ? 280 : '100%' }}>
                    <SectionCard style={{ gap: 8 }}>
                      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                        {article.category} · {article.readingTime}
                      </Text>
                      <Text style={{ fontSize: Typography.fontSize.lg, lineHeight: 24, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        {article.title}
                      </Text>
                      <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                        {article.excerpt}
                      </Text>
                    </SectionCard>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </View>

          <View style={{ gap: Spacing.sm }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Browse by category
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
              {LEARN_CATEGORIES.map((category) => {
                const count = getLearnArticlesByCategorySlug(category.slug).length;
                return (
                  <Link key={category.slug} href={`/learn/${category.slug}` as any} asChild>
                    <TouchableOpacity activeOpacity={0.82} style={{ flexGrow: 1, flexBasis: isWide ? 240 : '100%' }}>
                      <SectionCard style={{ gap: 8, minHeight: 150 }}>
                        <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                          {count} article{count === 1 ? '' : 's'}
                        </Text>
                        <Text style={{ fontSize: Typography.fontSize.lg, lineHeight: 24, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                          {category.title}
                        </Text>
                        <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 21, color: colors.textSecondary }}>
                          {category.description}
                        </Text>
                      </SectionCard>
                    </TouchableOpacity>
                  </Link>
                );
              })}
            </View>
          </View>

          <View style={{ gap: Spacing.sm }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              All articles
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
              {LEARN_ARTICLES.map((article) => (
                <Link key={article.slug} href={`/learn/${article.slug}` as any} asChild>
                  <TouchableOpacity activeOpacity={0.82} style={{ flexGrow: 1, flexBasis: isWide ? 300 : '100%' }}>
                    <SectionCard style={{ gap: 8 }}>
                      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                        {article.category} · {article.readingTime}
                      </Text>
                      <Text style={{ fontSize: Typography.fontSize.lg, lineHeight: 24, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        {article.title}
                      </Text>
                      <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                        {article.excerpt}
                      </Text>
                    </SectionCard>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </View>
        </View>
      </PublicShell>
    </>
  );
}
