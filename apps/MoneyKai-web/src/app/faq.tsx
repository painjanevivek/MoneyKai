import Head from 'expo-router/head';
import { Link } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { HOME_FAQS } from '@/content/publicSite';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const FAQ_CATEGORIES = [
  {
    title: 'Getting started',
    items: HOME_FAQS.slice(0, 2),
  },
  {
    title: 'Core features',
    items: HOME_FAQS.slice(2, 4),
  },
  {
    title: 'Trust and boundaries',
    items: HOME_FAQS.slice(4, 6),
  },
];

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_CATEGORIES.flatMap((category) =>
    category.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    }))
  ),
};

export default function FaqPage() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title="MoneyKai FAQ | Common questions about features, security, and getting started"
        description="Read common questions about MoneyKai, including expense tracking, budgeting, shared expenses, security, pricing, and financial-advice boundaries."
        path="/faq"
        keywords={['MoneyKai FAQ', 'budget app FAQ', 'expense tracking help', 'personal finance app questions']}
      />
      <Head>
        <script type="application/ld+json">{JSON.stringify(faqStructuredData)}</script>
      </Head>
      <PublicShell
        eyebrow="FAQ"
        title="Questions people commonly ask before they trust a finance app"
        description="The FAQ covers what MoneyKai is, how the main features work, what the product does not claim to do, and where users can go next."
      >
        <View style={{ gap: Spacing.xl }}>
          {FAQ_CATEGORIES.map((category) => (
            <View key={category.title} style={{ gap: Spacing.md }}>
              <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                {category.title}
              </Text>
              <View style={{ gap: Spacing.md }}>
                {category.items.map((item) => (
                  <SectionCard key={item.question}>
                    <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      {item.question}
                    </Text>
                    <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                      {item.answer}
                    </Text>
                  </SectionCard>
                ))}
              </View>
            </View>
          ))}

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Need more help?
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
              If a question is not covered here, the contact page gives users a clear route for support, feedback, and privacy or security-related concerns.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg }}>
              {[
                { href: '/contact' as const, label: 'Contact MoneyKai' },
                { href: '/security' as const, label: 'Read security page' },
              ].map((item) => (
                <Link key={item.href} href={item.href} asChild>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={{
                      paddingHorizontal: Spacing.md,
                      paddingVertical: 12,
                      borderRadius: BorderRadius.full,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </SectionCard>
        </View>
      </PublicShell>
    </>
  );
}
