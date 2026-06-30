import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { SITE } from '@/constants/site';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title="MoneyKai Privacy Policy | Local Android data handling"
        description="Read MoneyKai's privacy policy for the current local-only Android release, including device storage, local export, encrypted backup files, and unsupported cloud features."
        path="/privacy-policy"
        keywords={['privacy policy', 'MoneyKai privacy', 'local finance app data policy']}
      />
      <PublicShell
        eyebrow="Privacy"
        title="MoneyKai's current Android release keeps personal finance data local."
        description="This page explains the privacy model for the local-only Android release in plain language so people can understand what the app does before using it."
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing['5xl'] }}
        >
          {[
            {
              title: 'Last reviewed',
              body: 'This policy was reviewed on June 30, 2026 for the current Flutter Android release.',
            },
            {
              title: 'Data we store',
              body: 'The current Android release stores user-entered profile details, transactions, budgets, theme settings, encrypted backup metadata, and local diagnostics on the device.',
            },
            {
              title: 'How data is used',
              body: 'MoneyKai uses local data to show expense tracking, monthly budgets, dashboard summaries, savings and trend insights, settings, local diagnostics, and backup or restore actions that you start.',
            },
            {
              title: 'Local export',
              body: 'When you choose local export, MoneyKai copies a plaintext JSON snapshot of profile, transactions, budget, and theme settings to the clipboard. You control where that copied data goes next.',
            },
            {
              title: 'Encrypted backup files',
              body: 'When you choose encrypted backup, MoneyKai creates a password-protected JSON file through Android file or share flows. When you restore, MoneyKai reads only the backup file you select.',
            },
            {
              title: 'What MoneyKai does not collect in this release',
              body: 'The current Android release does not send app data to MoneyKai servers and does not include backend sync, Firebase cloud backup, analytics SDKs, remote crash reporting, ads, payment processing, bank sync, Gmail sync, SMS reading, notification capture, or Financial AI.',
            },
            {
              title: 'Android permissions',
              body: 'The current Android release does not request SMS, notification listener, contacts, camera, microphone, location, storage, all-files access, accessibility service, package visibility, or install-package permissions.',
            },
            {
              title: 'Deletion and retention',
              body: 'Local app data remains on your device until you delete or reset it, clear local diagnostics, or uninstall the app. Backup files that you export are stored wherever you choose to save or share them.',
            },
            {
              title: 'Sharing and selling',
              body: 'MoneyKai does not sell personal finance data. The current Android release does not share app data with MoneyKai or third parties unless you choose to export or share a backup file outside the app.',
            },
            {
              title: 'Future features',
              body: 'If MoneyKai later ships cloud sync, real authentication, analytics, crash reporting, bank sync, Gmail sync, SMS or notification capture, AI features, ads, or payments, the app, Play disclosures, and this policy must be updated before those features are released.',
            },
            {
              title: 'Support contact',
              body: `Questions about privacy can be sent to ${SITE.supportEmail}.`,
            },
          ].map((section) => (
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
