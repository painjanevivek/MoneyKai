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
    description: `Reach out for product questions, troubleshooting, or account help at ${SITE.supportEmail}.`,
    subject: 'MoneyKai Support',
    body: 'What do you need help with?\n\nAccount email, if relevant:\n\nDevice/browser:\n',
  },
  {
    icon: 'bug-outline',
    title: 'Bug report',
    description: `Report broken flows, crashes, incorrect totals, failed imports, or confusing behavior to ${SITE.supportEmail}.`,
    subject: 'MoneyKai Bug Report',
    body: [
      'Bug summary:',
      '',
      'Steps to reproduce:',
      '1.',
      '2.',
      '',
      'Expected result:',
      '',
      'Actual result:',
      '',
      'Device/browser:',
      '',
      'Screenshot or video link, if available:',
    ].join('\n'),
  },
  {
    icon: 'message-text-outline',
    title: 'Feedback',
    description: `Share ideas, suggestions, or improvements you would like to see in MoneyKai at ${SITE.supportEmail}.`,
    subject: 'MoneyKai Feedback',
    body: 'Feedback or idea:\n\nWhat problem would this solve for you?\n',
  },
  {
    icon: 'shield-lock-outline',
    title: 'Security and privacy',
    description: `Use ${SITE.supportEmail} for privacy questions, security concerns, or data-related requests.`,
    subject: 'MoneyKai Security and Privacy',
    body: 'Privacy, security, or data request:\n\nPlease avoid sending passwords, full card numbers, or sensitive document contents by email.\n',
  },
];

export default function ContactScreen() {
  const { colors } = useTheme();

  const openMail = (subject: string, body?: string) => {
    const params = new URLSearchParams({ subject });
    if (body) {
      params.set('body', body);
    }
    const url = `mailto:${SITE.supportEmail}?${params.toString()}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`mailto:${SITE.supportEmail}`).catch(() => undefined);
    });
  };

  return (
    <>
      <SeoHead
        title="Contact MoneyKai | Support, feedback, and privacy questions"
        description="Contact MoneyKai for support, bug reports, product feedback, privacy questions, and security or data-related requests."
        path="/contact"
        keywords={['MoneyKai contact', 'MoneyKai support', 'MoneyKai bug report', 'privacy support', 'budget app support']}
      />
      <PublicShell
        eyebrow="Contact"
        title="Contact MoneyKai without hunting for the right route."
        description={`Use ${SITE.supportEmail} for support, bug reports, product feedback, and privacy or security-related questions.`}
      >
        <View style={{ gap: Spacing.md }}>
          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Main support email
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              MoneyKai currently uses a direct email support path for account help, bug reports, feedback, privacy questions,
              and security concerns.
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
                  onPress={() => openMail(option.subject, option.body)}
                  accessibilityRole="button"
                  accessibilityLabel={`Email MoneyKai about ${option.title.toLowerCase()}`}
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
