import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { SITE } from '@/constants/site';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const POLICY_PATH = '/privacy-policy';
const LAST_REVIEWED = '2026-09-18';
const policyTitle = 'MoneyKai Privacy Policy | Cloud sync for your finance data';
const policyDescription =
  'Read how MoneyKai uses account and finance data to provide authenticated cloud sync, backups, and shared-expense features in its Android app.';
const policyUrl = `${SITE.url}${POLICY_PATH}`;
const policyImageUrl = `${SITE.url}/og-image.svg`;
const policyKeywords = ['privacy policy', 'MoneyKai privacy', 'finance app privacy', 'Google Play data safety'];

const policySections = [
  {
    title: 'Scope',
    body: 'This policy covers the MoneyKai React Native Android app, package com.moneykai.mobile, and the MoneyKai services it uses to provide authenticated cloud sync. It applies to the public Play release, not separate internal research builds.',
  },
  {
    title: 'Developer and contact',
    body: `MoneyKai is the app name and developer identity used for this release. Privacy questions or deletion requests can be sent to ${SITE.supportEmail}.`,
  },
  {
    title: 'Information we process',
    body: 'To provide the service, MoneyKai processes account identifiers supplied through sign-in, user-entered profile details, transactions, budgets, savings goals, group and split-expense data, app settings, and backup snapshots. The app also keeps a local working copy on your device so it can remain useful when your connection is interrupted.',
  },
  {
    title: 'How cloud sync works',
    body: 'When you sign in, MoneyKai sends the information needed for your account, sync, Firebase cloud backup, and shared-expense features to MoneyKai services. Firebase is used for authentication and MoneyKai backend services process synced application data for the authenticated account. We use this information to provide the features you request, restore your data, keep your signed-in devices consistent, and maintain service security.',
  },
  {
    title: 'Optional device notifications',
    body: 'If you enable app notifications, MoneyKai may show reminders or app alerts on your device and handle your response to those alerts. The public Play release does not request notification-listener access and does not read notifications from other apps.',
  },
  {
    title: 'What the public Play release does not access',
    body: 'The public Play release does not read SMS messages, capture other apps’ notifications, access contacts, camera, microphone, location, or legacy shared-storage permissions. Optional notification capture is disabled. It does not include Gmail sync, PDF statement parsing, wealth integrations, Financial AI, advertising, payment processing, or bank-account aggregation.',
  },
  {
    title: 'Diagnostics and selling data',
    body: 'The public Play release disables remote Sentry reporting and diagnostic-event uploads. Optional local diagnostics remain on the device for troubleshooting and are not uploaded in this release. MoneyKai does not sell personal or sensitive user data, and it does not use financial data for advertising.',
  },
  {
    title: 'Retention and deletion',
    body: 'Data stored on your device remains until you delete it, clear app storage, or uninstall the app. Account and synced data are retained while your account is active so the service can provide sync and backups. You may request account and synced-data deletion through the support contact above; we will verify the request before completing it.',
  },
  {
    title: 'Sharing',
    body: 'MoneyKai shares data only with the service providers needed to authenticate you and operate the cloud-sync service, or when you intentionally use a sharing feature such as a group expense or exported file. We do not sell this data.',
  },
  {
    title: 'Cookies and local storage',
    body: 'This public website may use necessary browser storage for sign-in, preferences, security, and page behavior. The Android app does not use web cookies.',
  },
  {
    title: 'Optional diagnostics and performance telemetry',
    body: 'Optional website diagnostics and performance telemetry run only after you accept analytics consent. MoneyKai uses this information to find broken routes and performance regressions without collecting financial document contents.',
  },
  {
    title: 'Changes',
    body: 'If a future release adds a new data source, permission, processor, or purpose, MoneyKai will update this policy and the corresponding Google Play Data Safety disclosures before that release is distributed.',
  },
  {
    title: 'Last reviewed',
    body: 'This policy was last reviewed on September 18, 2026 for the cloud-sync minimal Android Play release.',
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
        title="MoneyKai syncs the finance data you choose to save."
        description="This page explains the cloud-sync Android release in plain language for people and Play reviewers."
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
