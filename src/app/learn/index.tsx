import React from 'react';
import { Link } from 'expo-router';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { LEARN_ARTICLES } from '@/content/learn';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function LearnIndexScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

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
        title="Original, indexable finance content built around the product's real use cases."
        description="MoneyKai Learn avoids scraped articles and generic filler. It focuses on the questions people actually face when budgeting, splitting costs, and recovering from stressful money periods."
      >
        <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md, flexWrap: 'wrap' }}>
          {LEARN_ARTICLES.map((article) => (
            <Link key={article.slug} href={`/learn/${article.slug}` as const} asChild>
              <TouchableOpacity activeOpacity={0.82} style={{ flex: 1, minWidth: isWide ? 260 : undefined }}>
                <SectionCard>
                  <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                    {article.category} · {article.readTime}
                  </Text>
                  <Text style={{ marginTop: 8, fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {article.title}
                  </Text>
                  <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                    {article.description}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.md }}>
                    {article.keywords.map((keyword) => (
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
      </PublicShell>
    </>
  );
}
