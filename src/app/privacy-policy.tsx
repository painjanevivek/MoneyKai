import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
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
        description="Read MoneyKai’s privacy policy for data storage, backups, account handling, and how personal finance information is used inside the app."
        path="/privacy-policy"
        keywords={['privacy policy', 'MoneyKai privacy', 'finance app data policy']}
      />
      <PublicShell
        eyebrow="Privacy"
        title="MoneyKai keeps personal finance data visible, useful, and under user control."
        description="This page explains the basic privacy model for MoneyKai in plain language so people can understand the product before creating an account."
      >
        <View style={{ gap: Spacing.md }}>
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
        </View>
      </PublicShell>
    </>
  );
}
