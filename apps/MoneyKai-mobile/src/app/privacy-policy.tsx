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
        title="MoneyKai Privacy Policy | Cloud sync for your finance data"
        description="Read how MoneyKai uses account and finance data to provide authenticated cloud sync in its Android app."
        path="/privacy-policy"
        keywords={['privacy policy', 'MoneyKai privacy', 'cloud-sync finance app']}
      />
      <PublicShell
        eyebrow="Privacy"
        title="MoneyKai syncs the finance data you choose to save."
        description="A plain-language summary of the public Android Play release."
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing['5xl'] }}
        >
          {[
            {
              title: 'Last reviewed',
              body: 'This policy was reviewed on September 18, 2026 for the cloud-sync minimal Android Play release.',
            },
            {
              title: 'What MoneyKai processes',
              body: 'MoneyKai processes the account identifiers you use to sign in, the profile details and finance data you enter, including transactions, budgets, savings goals, group expenses, settings, and backup snapshots.',
            },
            {
              title: 'Why we process it',
              body: 'MoneyKai uses this data to provide your signed-in account, cloud sync, Firebase cloud backup, shared-expense features, and a local working copy that remains useful during a temporary connection interruption.',
            },
            {
              title: 'Where it goes',
              body: 'Firebase provides authentication. MoneyKai backend services process the synced data needed for your authenticated account. MoneyKai does not sell personal or sensitive user data and does not use financial data for advertising.',
            },
            {
              title: 'Public Play release limits',
              body: 'This public Play release does not read SMS, access contacts, camera, microphone, location, or legacy shared storage, and it does not read notifications from other apps. Optional notification capture, Gmail sync, PDF statement parsing, wealth integrations, Financial AI, remote Sentry reporting, and remote diagnostic-event uploads are disabled. Optional local diagnostics remain on-device and are not uploaded.',
            },
            {
              title: 'Notifications',
              body: 'If you enable app notifications, MoneyKai may show reminders or app alerts on this device. It does not request notification-listener access or inspect notifications from other apps.',
            },
            {
              title: 'Retention and deletion',
              body: 'Local data remains until you delete it, clear app storage, or uninstall the app. Synced data is retained while your account is active to provide sync and backups. You can request account and synced-data deletion through support.',
            },
            {
              title: 'Support contact',
              body: `Questions about privacy or deletion requests can be sent to ${SITE.supportEmail}.`,
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
