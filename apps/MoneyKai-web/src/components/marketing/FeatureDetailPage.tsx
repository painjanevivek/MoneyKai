import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import type { PublicFeature } from '@/content/publicSite';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function FeatureDetailPage({ feature }: { feature: PublicFeature }) {
  const { colors } = useTheme();
  const featurePath = `/features/${feature.slug}`;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: feature.faqs.map((faq) => ({
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
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://moneykai.app/' },
        { '@type': 'ListItem', position: 2, name: 'Features', item: 'https://moneykai.app/features' },
        { '@type': 'ListItem', position: 3, name: feature.title, item: `https://moneykai.app${featurePath}` },
      ],
    },
  ];

  return (
    <>
      <SeoHead
        title={`MoneyKai ${feature.title} | ${feature.shortTitle}`}
        description={feature.description}
        path={featurePath}
        keywords={feature.keywords}
        structuredData={structuredData}
      />
      <PublicShell
        eyebrow={feature.category}
        title={feature.heroTitle}
        description={feature.heroDescription}
      >
        <View style={{ gap: Spacing.xl }}>
          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              What is MoneyKai {feature.title}?
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              MoneyKai {feature.title.toLowerCase()} helps users {feature.description.charAt(0).toLowerCase() + feature.description.slice(1)}
            </Text>
          </SectionCard>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Why this feature matters
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              {feature.description}
            </Text>
          </SectionCard>

          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Key benefits
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
              {feature.benefits.map((benefit) => (
                <SectionCard key={benefit} style={{ flexBasis: 260, flexGrow: 1 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      backgroundColor: colors.primaryBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: Spacing.md,
                    }}
                  >
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={{ fontSize: Typography.fontSize.md, lineHeight: 22, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                    {benefit}
                  </Text>
                </SectionCard>
              ))}
            </View>
          </View>

          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Common use cases
            </Text>
            <View style={{ gap: Spacing.md }}>
              {feature.useCases.map((useCase, index) => (
                <SectionCard key={useCase}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: Typography.fontSize.md, lineHeight: 22, color: colors.textPrimary }}>
                      {useCase}
                    </Text>
                  </View>
                </SectionCard>
              ))}
            </View>
          </View>

          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Frequently asked questions
            </Text>
            <View style={{ gap: Spacing.md }}>
              {feature.faqs.map((faq) => (
                <SectionCard key={faq.question}>
                  <Text style={{ fontSize: Typography.fontSize.lg, lineHeight: 24, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {faq.question}
                  </Text>
                  <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                    {faq.answer}
                  </Text>
                </SectionCard>
              ))}
            </View>
          </View>
        </View>
      </PublicShell>
    </>
  );
}
