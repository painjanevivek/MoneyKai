import React from 'react';
import { Link } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { SITE } from '@/constants/site';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { PUBLIC_FEATURES } from '@/content/publicSite';
import { useTheme } from '@/hooks/useTheme';

const SERVICE_ITEMS = [
  ...PUBLIC_FEATURES.map((feature) => ({
    name: feature.title,
    description: feature.description,
    href: `/features/${feature.slug}`,
  })),
  {
    name: 'Financial First Aid',
    description:
      'Support stressful money moments with a calmer framework for essentials, clarity, and practical next steps.',
    href: '/financial-first-aid',
  },
];

export default function ServicesPage() {
  const { colors } = useTheme();
  const description =
    'Explore MoneyKai services for local expense tracking, budgeting, shared expenses, savings, analytics, encrypted backup files, and financial first aid.';
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'MoneyKai services',
    url: `${SITE.url}/services`,
    itemListElement: SERVICE_ITEMS.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.name,
        description: service.description,
        provider: {
          '@type': 'Organization',
          name: SITE.name,
          url: SITE.url,
        },
        url: `${SITE.url}${service.href}`,
      },
    })),
  };

  return (
    <>
      <SeoHead
        title="MoneyKai Services | Official personal finance app services"
        description={description}
        path="/services"
        keywords={['MoneyKai services', 'personal finance services', 'budget management app', 'expense tracking service']}
        structuredData={structuredData}
      />
      <PublicShell
        eyebrow="Services"
        title="MoneyKai Services"
        description="The official MoneyKai service pages explain how the current Android app helps users organize daily expenses, budgets, shared costs, savings, analytics, encrypted backup files, and financial first-aid moments."
      >
        <View style={{ gap: Spacing.xl }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
            {SERVICE_ITEMS.map((service) => (
              <SectionCard key={service.name} style={{ flexBasis: 280, flexGrow: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {service.name}
                </Text>
                <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  {service.description}
                </Text>
                <Link href={service.href as any} asChild>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: Spacing.md,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: 12,
                      borderRadius: BorderRadius.full,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      Open service
                    </Text>
                  </TouchableOpacity>
                </Link>
              </SectionCard>
            ))}
          </View>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Official MoneyKai support
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              For product questions, privacy requests, and support, use the official contact route at {SITE.supportEmail}.
            </Text>
          </SectionCard>
        </View>
      </PublicShell>
    </>
  );
}
