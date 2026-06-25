import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { ComparisonPage } from '@/components/marketing/ComparisonPage';
import { SeoHead } from '@/components/marketing/SeoHead';
import { COMPARISON_PAGES, getComparisonBySlug } from '@/content/comparisons';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return COMPARISON_PAGES.map((page) => ({ slug: page.slug }));
}

export default function ComparisonRoute() {
  const { colors } = useTheme();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const page = getComparisonBySlug(slug);

  if (!page) {
    return (
      <>
        <SeoHead
          title="MoneyKai Comparisons | Page not found"
          description="The requested MoneyKai comparison page could not be found. Browse all comparisons for budget app and expense tracker alternatives."
          path="/compare"
          robots="noindex,follow"
        />
        <PublicShell eyebrow="Compare" title="Comparison not found" description="Browse the comparison hub to find the right MoneyKai alternative page.">
          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              We could not find that comparison.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/compare' as any)}
              style={{
                alignSelf: 'flex-start',
                marginTop: Spacing.md,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.full,
                backgroundColor: colors.primary,
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                Back to comparisons
              </Text>
            </TouchableOpacity>
          </SectionCard>
        </PublicShell>
      </>
    );
  }

  return <ComparisonPage page={page} />;
}
