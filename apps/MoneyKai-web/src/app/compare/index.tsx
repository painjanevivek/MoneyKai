import React from 'react';
import { Link } from 'expo-router';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { SITE } from '@/constants/site';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { COMPARISON_PAGES } from '@/content/comparisons';
import { useTheme } from '@/hooks/useTheme';

export default function CompareIndexPage() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'MoneyKai comparisons',
    url: `${SITE.url}/compare`,
    description: 'Compare MoneyKai with spreadsheets, basic expense trackers, and other ways to manage personal finance.',
  };

  return (
    <>
      <SeoHead
        title="MoneyKai Comparisons | Budget App and Expense Tracker Alternatives"
        description="Compare MoneyKai with spreadsheets and basic expense trackers to choose the right personal finance workflow for expenses, budgets, reports, and shared costs."
        path="/compare"
        keywords={['MoneyKai comparisons', 'budget app comparison', 'expense tracker alternative', 'spreadsheet alternative']}
        structuredData={structuredData}
      />
      <PublicShell
        eyebrow="Compare"
        title="Compare MoneyKai with other ways to manage money"
        description="Answer-first comparison pages for people choosing between MoneyKai, spreadsheets, expense trackers, and budgeting workflows."
      >
        <View style={{ gap: Spacing.xl }}>
          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
              DIRECT ANSWER
            </Text>
            <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              When should you choose MoneyKai?
            </Text>
            <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.md, lineHeight: 26, color: colors.textSecondary }}>
              Choose MoneyKai when you want a guided local personal finance app that connects expenses, budgets, shared costs, savings, summaries, and encrypted backup files. Choose a spreadsheet or basic tracker when you only need manual logging.
            </Text>
          </SectionCard>

          <View style={{ flexDirection: isWide ? 'row' : 'column', flexWrap: 'wrap', gap: Spacing.md }}>
            {COMPARISON_PAGES.map((page) => (
              <SectionCard key={page.slug} style={{ flex: 1, minWidth: isWide ? 320 : undefined }}>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                  {page.title}
                </Text>
                <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  {page.heroDescription}
                </Text>
                <Link href={`/compare/${page.slug}` as any} asChild>
                  <TouchableOpacity
                    accessibilityRole="link"
                    accessibilityLabel={`Read ${page.title}`}
                    activeOpacity={0.82}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: Spacing.lg,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: 12,
                      borderRadius: BorderRadius.full,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                    }}
                  >
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      Read comparison
                    </Text>
                  </TouchableOpacity>
                </Link>
              </SectionCard>
            ))}
          </View>
        </View>
      </PublicShell>
    </>
  );
}
