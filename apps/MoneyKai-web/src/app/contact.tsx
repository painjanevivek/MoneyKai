import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { SITE } from '@/constants/site';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const CONTACT_OPTIONS = [
  {
    icon: 'lifebuoy',
    title: 'Support',
    description: 'Reach out for product questions, troubleshooting, or account help.',
    subject: 'MoneyKai Support',
  },
  {
    icon: 'message-text-outline',
    title: 'Feedback',
    description: 'Share ideas, suggestions, or improvements you would like to see in MoneyKai.',
    subject: 'MoneyKai Feedback',
  },
  {
    icon: 'shield-lock-outline',
    title: 'Security and privacy',
    description: 'Use this route for privacy questions, security concerns, or data-related requests.',
    subject: 'MoneyKai Security and Privacy',
  },
];

export default function ContactScreen() {
  const { colors } = useTheme();

  const openMail = (subject: string) => {
    const url = `mailto:${SITE.supportEmail}?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`mailto:${SITE.supportEmail}`).catch(() => undefined);
    });
  };

  return (
    <>
      <SeoHead
        title="Contact MoneyKai | Support, feedback, and privacy questions"
        description="Contact MoneyKai for support, product feedback, privacy questions, and security or data-related requests."
        path="/contact"
        keywords={['MoneyKai contact', 'MoneyKai support', 'privacy support', 'budget app support']}
      />
      <PublicShell
        eyebrow="Contact"
        title="Contact MoneyKai without hunting for the right route."
        description="The public contact page gives users a clear path for product help, feedback, and privacy or security-related questions."
      >
        <View style={{ gap: Spacing.md }}>
          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Main support email
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              MoneyKai currently uses a direct email support path so users can reach the team without a separate ticketing flow.
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
              {SITE.supportEmail}
            </Text>
          </SectionCard>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
            {CONTACT_OPTIONS.map((option) => (
              <SectionCard key={option.title} style={{ flexBasis: 260, flexGrow: 1 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: colors.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: Spacing.md,
                  }}
                >
                  <MaterialCommunityIcons name={option.icon as any} size={22} color={colors.primary} />
                </View>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {option.title}
                </Text>
                <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  {option.description}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.82}
                  onPress={() => openMail(option.subject)}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: Spacing.md,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 12,
                    borderRadius: BorderRadius.full,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    Email about {option.title.toLowerCase()}
                  </Text>
                </TouchableOpacity>
              </SectionCard>
            ))}
          </View>
        </View>
      </PublicShell>
    </>
  );
}
