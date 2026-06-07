import React from 'react';
import { Text, View } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const LAST_UPDATED = 'June 7, 2026';

const TERMS_SECTIONS = [
  {
    title: 'Acceptance of terms',
    body: 'By using MoneyKai, users agree to these terms. If they do not agree, they should stop using the service.',
  },
  {
    title: 'Use of MoneyKai',
    body: 'MoneyKai is intended to help users organize and understand personal finance information such as budgets, transactions, savings progress, and shared expenses.',
  },
  {
    title: 'Account responsibility',
    body: 'Users are responsible for helping keep their account access secure and for the information connected to that account.',
  },
  {
    title: 'No professional financial advice',
    body: 'MoneyKai provides product functionality for personal finance organization. It does not replace professional financial, legal, investment, or tax advice.',
  },
  {
    title: 'Service availability',
    body: 'Features may change, improve, or become temporarily unavailable over time because of maintenance, bugs, connectivity issues, or product changes.',
  },
  {
    title: 'Data responsibility',
    body: 'Users are responsible for reviewing the accuracy of the information they enter before relying on it for important decisions.',
  },
];

export default function TermsScreen() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title="MoneyKai Terms | Basic terms of use"
        description="Read the MoneyKai terms covering account responsibility, product limitations, service availability, and professional-advice boundaries."
        path="/terms"
        keywords={['MoneyKai terms', 'terms of use', 'personal finance app terms']}
      />
      <PublicShell
        eyebrow="Terms"
        title="MoneyKai's terms are meant to stay readable and specific."
        description="This page explains the basic expectations around using the product, account responsibility, service limitations, and the boundary between app functionality and professional advice."
      >
        <View style={{ gap: Spacing.md }}>
          {TERMS_SECTIONS.map((section) => (
            <SectionCard key={section.title}>
              <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                {section.title}
              </Text>
              <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
                {section.body}
              </Text>
            </SectionCard>
          ))}

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Last updated
            </Text>
            <Text style={{ marginTop: 8, fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
              {LAST_UPDATED}
            </Text>
          </SectionCard>
        </View>
      </PublicShell>
    </>
  );
}
