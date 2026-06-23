import React from 'react';
import { Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import type { LearnArticle, LearnCategory } from '@/data/learnArticles';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useHydratedViewportWidth } from '@/hooks/useHydratedViewportWidth';
import { useTheme } from '@/hooks/useTheme';

export function LearnCategoryTemplate({
  category,
  articles,
}: {
  category: LearnCategory;
  articles: LearnArticle[];
}) {
  const { colors } = useTheme();
  const width = useHydratedViewportWidth();
  const isWide = width >= 900;

  return (
    <>
      <SeoHead
        title={category.metaTitle}
        description={category.metaDescription}
        path={`/learn/${category.slug}`}
        keywords={[category.title, 'MoneyKai Learn']}
      />
      <PublicShell eyebrow="MoneyKai Learn" title={category.title} description={category.description}>
        <View style={{ gap: Spacing.lg, paddingBottom: Spacing['2xl'] }}>
          <SectionCard variant="elevated" borderRadius="2xl" style={{ gap: Spacing.sm }}>
            <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              {category.title} articles
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary, maxWidth: 820 }}>
              These articles focus on the topic most relevant to this category, so the page stays useful, focused, and easy to scan.
            </Text>
          </SectionCard>

          <View style={{ flexDirection: isWide ? 'row' : 'column', flexWrap: 'wrap', gap: Spacing.md }}>
            {articles.map((article) => (
              <Link key={article.slug} href={`/learn/${article.slug}` as any} asChild>
                <TouchableOpacity activeOpacity={0.82} style={{ flexGrow: 1, flexBasis: isWide ? 300 : undefined }}>
                  <SectionCard style={{ gap: 8 }}>
                    <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                      {article.readingTime}
                    </Text>
                    <Text style={{ fontSize: Typography.fontSize.lg, lineHeight: 24, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      {article.title}
                    </Text>
                    <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 21, color: colors.textSecondary }}>
                      {article.excerpt}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm }}>
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

          <SectionCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: BorderRadius.full, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="arrow-top-right" size={18} color={colors.primary} />
              </View>
              <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary, flex: 1 }}>
                More category pages can be added without changing the structure. This keeps the Learn hub easy to grow.
              </Text>
            </View>
          </SectionCard>
        </View>
      </PublicShell>
    </>
  );
}
