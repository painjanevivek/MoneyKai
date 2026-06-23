import React from 'react';
import { Link, router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { SITE } from '@/constants/site';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import type { ComparisonPage as ComparisonPageData } from '@/content/comparisons';
import { useHydratedViewportWidth } from '@/hooks/useHydratedViewportWidth';
import { useTheme } from '@/hooks/useTheme';

export function ComparisonPage({ page }: { page: ComparisonPageData }) {
  const { colors } = useTheme();
  const width = useHydratedViewportWidth();
  const isWide = width >= 900;
  const path = `/compare/${page.slug}`;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
        { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE.url}/compare` },
        { '@type': 'ListItem', position: 3, name: page.title, item: `${SITE.url}${path}` },
      ],
    },
  ];

  return (
    <>
      <SeoHead
        title={page.metaTitle}
        description={page.metaDescription}
        path={path}
        keywords={page.keywords}
        structuredData={structuredData}
      />
      <PublicShell eyebrow="Compare" title={page.heroTitle} description={page.heroDescription}>
        <View style={{ gap: Spacing.xl }}>
          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
              DIRECT ANSWER
            </Text>
            <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Which should you choose?
            </Text>
            <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.md, lineHeight: 26, color: colors.textSecondary }}>
              {page.directAnswer}
            </Text>
          </SectionCard>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Best fit
            </Text>
            <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
              {page.bestFor.map((item) => (
                <View key={item} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                  <View style={{ width: 8, height: 8, borderRadius: BorderRadius.full, backgroundColor: colors.primary, marginTop: 8 }} />
                  <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </SectionCard>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Feature comparison
            </Text>
            <View style={{ gap: Spacing.sm, marginTop: Spacing.lg }}>
              <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.sm }}>
                <Text style={{ flex: 0.8, fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                  Decision area
                </Text>
                <Text style={{ flex: 1, fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
                  MoneyKai
                </Text>
                <Text style={{ flex: 1, fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                  {page.alternativeName}
                </Text>
              </View>
              {page.comparisonRows.map((row) => (
                <View
                  key={row.label}
                  style={{
                    flexDirection: isWide ? 'row' : 'column',
                    gap: Spacing.sm,
                    paddingVertical: Spacing.md,
                    borderTopWidth: 1,
                    borderTopColor: colors.borderLight,
                  }}
                >
                  <Text style={{ flex: 0.8, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {row.label}
                  </Text>
                  <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                    {row.moneykai}
                  </Text>
                  <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                    {row.alternative}
                  </Text>
                </View>
              ))}
            </View>
          </SectionCard>

          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Frequently asked questions
            </Text>
            {page.faqs.map((faq) => (
              <SectionCard key={faq.question}>
                <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {faq.question}
                </Text>
                <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  {faq.answer}
                </Text>
              </SectionCard>
            ))}
          </View>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Try MoneyKai first
            </Text>
            <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
              The fastest way to compare MoneyKai is to set a budget or add one real transaction and see whether the review flow feels easier than maintaining another system.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg }}>
              <Button title="Create secure account" onPress={() => router.push('/(auth)/signup')} icon="shield-account-outline" />
              <Link href={'/compare' as any} asChild>
                <TouchableOpacity
                  activeOpacity={0.82}
                  style={{
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 12,
                    borderRadius: BorderRadius.full,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                  }}
                >
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    See all comparisons
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </SectionCard>
        </View>
      </PublicShell>
    </>
  );
}

export default ComparisonPage;
