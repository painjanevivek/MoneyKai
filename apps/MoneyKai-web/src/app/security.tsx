import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const SECURITY_SECTIONS = [
  {
    title: 'Local release boundary',
    body: 'The current Flutter Android release uses a local profile/session and does not include real remote authentication, Firebase sign-in, OAuth, or backend account sync.',
  },
  {
    title: 'Data continuity',
    body: 'The current Android release supports plaintext local export and password-encrypted JSON backup files through user-started device flows. It does not provide cloud backup.',
  },
  {
    title: 'Practical privacy boundaries',
    body: 'MoneyKai does not position itself as a bank. It is a budgeting and personal finance application, which means security communication should stay precise about what the product does and does not handle.',
  },
  {
    title: 'Visible expectations',
    body: 'The public website now surfaces privacy, support contact, trust explanations, and financial first-aid guidance so the product feels accountable before signup.',
  },
];

export default function SecurityScreen() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title="MoneyKai Security | Local storage, backup files, and clear expectations"
        description="Read how MoneyKai approaches local Android storage, encrypted backup files, privacy boundaries, and transparent expectations for a personal finance app."
        path="/security"
        keywords={['MoneyKai security', 'budget app security', 'local finance app', 'encrypted backup files']}
      />
      <PublicShell
        eyebrow="Security"
        title="Security communication should be specific, calm, and honest."
        description="MoneyKai's public security layer focuses on local storage, encrypted backup files, and clear boundaries. It avoids inflated claims and explains what the current Android app is designed to protect."
      >
        <View style={{ gap: Spacing.md }}>
          {SECURITY_SECTIONS.map((section) => (
            <SectionCard key={section.title}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 16,
                    backgroundColor: colors.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="lock-check-outline" size={22} color={colors.primary} />
                </View>
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
