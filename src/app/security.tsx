import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const SECURITY_SECTIONS = [
  {
    title: 'Authentication',
    body: 'MoneyKai uses Firebase authentication for account access. Signed-in experiences are separated from the public website layer so people can understand the product before sharing any account information.',
  },
  {
    title: 'Data continuity',
    body: 'Backup and restore capabilities are part of the trust model. Financial history is useful only when users can retain access to it and recover it intentionally.',
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
        title="MoneyKai Security | Account protection, backup continuity, and clear security expectations"
        description="Read how MoneyKai approaches authentication, backup continuity, privacy boundaries, and transparent expectations for a personal finance app."
        path="/security"
        keywords={['MoneyKai security', 'budget app security', 'Firebase auth finance app', 'backup continuity']}
      />
      <PublicShell
        eyebrow="Security"
        title="Security communication should be specific, calm, and honest."
        description="MoneyKai’s public security layer focuses on authentication, continuity, and clear boundaries. It avoids making inflated claims and explains what the app is designed to protect."
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
