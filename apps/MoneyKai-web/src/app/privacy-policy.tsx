import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { SITE } from '@/constants/site';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const POLICY_PATH = '/privacy-policy';
const LAST_REVIEWED = '2026-06-30';
const policyTitle = 'MoneyKai Privacy Policy | Local Android data handling';
const policyDescription =
  "Read MoneyKai's privacy policy for the current local-only Android release, including device storage, clipboard export, encrypted backup files, and unsupported cloud features.";
const policyUrl = `${SITE.url}${POLICY_PATH}`;
const policyImageUrl = `${SITE.url}/og-image.svg`;
const policyKeywords = ['privacy policy', 'MoneyKai privacy', 'local finance app data policy', 'Google Play data safety'];

const policySections = [
  {
    title: 'Scope',
    body: 'This policy covers the current MoneyKai Flutter Android release for Google Play. The audited release is a local-first budgeting and expense-tracking app for package com.moneykai.mobile.',
  },
  {
    title: 'Developer and contact',
    body: `MoneyKai is the app name and developer identity used for this release. Privacy questions can be sent to ${SITE.supportEmail}.`,
  },
  {
    title: 'Data stored on your device',
    body: 'The current Android release stores user-entered profile details, transactions, budgets, theme settings, encrypted backup metadata, and local diagnostics on the device.',
  },
  {
    title: 'How local data is used',
    body: 'MoneyKai uses local data to show expense tracking, monthly budgets, dashboard summaries, savings and trend insights, settings, local diagnostics, and backup or restore actions that you start.',
  },
  {
    title: 'Plaintext clipboard export',
    body: 'When you choose local export, MoneyKai copies a plaintext JSON snapshot of profile, transactions, budget, and theme settings to the clipboard. You control where that copied data goes next.',
  },
  {
    title: 'Password-encrypted backup files',
    body: 'When you choose encrypted backup, MoneyKai creates a password-protected JSON file through Android file or share flows. When you restore, MoneyKai reads only the backup file you select.',
  },
  {
    title: 'Data MoneyKai does not receive',
    body: 'The current Android release does not send app data to MoneyKai servers and does not include backend sync, Firebase cloud backup, analytics SDKs, remote crash reporting, ads, payment processing, bank sync, Gmail sync, SMS reading, notification capture, or Financial AI.',
  },
  {
    title: 'Android permissions',
    body: 'The current Android release does not request SMS, notification listener, contacts, camera, microphone, location, storage, all-files access, accessibility service, package visibility, or install-package permissions.',
  },
  {
    title: 'Cookies and local storage',
    body: 'This public website may use necessary browser storage for sign-in, preferences, security, and page behavior. The current Android app release does not use web cookies.',
  },
  {
    title: 'Optional diagnostics and performance telemetry',
    body: 'Optional diagnostics and performance telemetry run only after you accept analytics consent on the website. MoneyKai uses this information to find broken routes, performance regressions, and product issues without collecting financial document contents.',
  },
  {
    title: 'Retention and deletion',
    body: 'Local app data remains on your device until you delete or reset it, clear local diagnostics, or uninstall the app. Backup files that you export are stored wherever you choose to save or share them.',
  },
  {
    title: 'Sharing and sale',
    body: 'MoneyKai does not sell personal or sensitive user data. The current Android release does not share app data with MoneyKai or third parties unless you choose to export or share a backup file outside the app.',
  },
  {
    title: 'Future features',
    body: 'If MoneyKai later ships cloud sync, real authentication, analytics, crash reporting, bank sync, Gmail sync, SMS or notification capture, AI features, ads, or payments, the app, Play disclosures, and this policy must be updated before those features are released.',
  },
  {
    title: 'Last reviewed',
    body: 'This policy was last reviewed on June 30, 2026 against the current Flutter Android Play Store release readiness and pre-upload audit.',
  },
];

export function generateMetadata() {
  return {
    title: policyTitle,
    description: policyDescription,
    applicationName: SITE.name,
    keywords: policyKeywords,
    robots: 'index,follow',
    alternates: {
      canonical: policyUrl,
    },
    openGraph: {
      type: 'website',
      title: policyTitle,
      description: policyDescription,
      url: policyUrl,
      siteName: SITE.name,
      images: [policyImageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: policyTitle,
      description: policyDescription,
      images: [policyImageUrl],
    },
  };
}

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title={policyTitle}
        description={policyDescription}
        path={POLICY_PATH}
        keywords={policyKeywords}
        structuredData={{
          '@type': 'WebPage',
          '@id': `${policyUrl}#webpage`,
          url: policyUrl,
          name: 'MoneyKai Privacy Policy',
          description: policyDescription,
          dateModified: LAST_REVIEWED,
          isPartOf: {
            '@id': `${SITE.url}/#website`,
          },
          about: {
            '@type': 'MobileApplication',
            name: SITE.name,
            applicationCategory: 'FinanceApplication',
            operatingSystem: 'Android',
          },
        }}
      />
      <PublicShell
        eyebrow="Privacy"
        title="MoneyKai's current Android release keeps personal finance data local."
        description="This page explains the privacy model for the local-only Android release in plain language so Play reviewers and users can understand what the app does before using it."
      >
        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing['5xl'] }}
        >
          {policySections.map((section) => (
            <SectionCard key={section.title}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
                <MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {section.title}
                  </Text>
                  <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                    {section.body}
                  </Text>
                </View>
              </View>
            </SectionCard>
          ))}
        </ScrollView>
      </PublicShell>
    </>
  );
}
