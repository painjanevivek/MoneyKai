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
        title="MoneyKai Privacy Policy | How account and finance data is used"
        description="Read MoneyKai's privacy policy for data storage, backups, account handling, and how personal finance information is used inside the app."
        path="/privacy-policy"
        keywords={['privacy policy', 'MoneyKai privacy', 'finance app data policy']}
      />
      <PublicShell
        eyebrow="Privacy"
        title="MoneyKai keeps personal finance data visible, useful, and under user control."
        description="This page explains the basic privacy model for MoneyKai in plain language so people can understand the product before creating an account."
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing['5xl'] }}
        >
          {[
            {
              title: 'Data we store',
              body: 'Your profile, transactions, notes, groups, savings-related records, settings, and notification preferences may be stored locally on your device and, when backup is enabled, in your connected Firebase setup.',
            },
            {
              title: 'How data is used',
              body: 'MoneyKai uses this information to power budgeting, analytics, shared expense coordination, notes, reminders, and backup and restore experiences.',
            },
            {
              title: 'Auto Capture',
              body: 'Auto Capture is optional. When enabled with Android notification access, MoneyKai uses supported bank and payment notifications to create reviewable transaction drafts on your device. Drafts do not affect budgets or transaction history until you confirm them.',
            },
            {
              title: 'Capture data minimization',
              body: 'MoneyKai stores parsed capture details such as source, amount, merchant, confidence, safe explanation metadata, and review status. Full raw notification payloads and unrelated notification content are not shown by default and should not be kept in normal capture history.',
            },
            {
              title: 'Capture controls',
              body: 'You can disable Auto Capture, turn notification capture off, revoke Android notification access in system settings, ignore drafts, or clear pending capture history without deleting confirmed transactions.',
            },
            {
              title: 'SMS Research Mode',
              body: 'SMS Research Mode is experimental, disabled by default, and intended for internal research builds only. When available, MoneyKai may create reviewable drafts from supported transaction SMS signals, stores only sanitized parsed fields, and excludes raw SMS bodies and capture inbox data from cloud backups by default.',
            },
            {
              title: 'Sharing and selling',
              body: 'MoneyKai does not sell your personal finance data. Backup data is intended to remain accessible only to the authenticated account connected to that environment.',
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
