import React, { useState } from 'react';
import { Alert, Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
    description: 'Open a GitHub issue for product questions, troubleshooting, local data, or backup-file help.',
    issueTitle: 'Support request: ',
    issueBody: 'What do you need help with?\n\nDevice/browser:\n\nScreenshots or links, if useful:\n',
  },
  {
    icon: 'bug-outline',
    title: 'Bug report',
    description: 'Report broken flows, crashes, incorrect totals, backup-file issues, or confusing behavior with a GitHub issue.',
    issueTitle: 'Bug report: ',
    issueBody: [
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
    icon: 'shield-lock-outline',
    title: 'Security and privacy',
    description: 'Open a GitHub issue for privacy questions or data-related requests. Do not include secrets or sensitive document contents.',
    issueTitle: 'Security or privacy request: ',
    issueBody: 'Privacy, security, or data request:\n\nPlease do not include passwords, full card numbers, secrets, or sensitive document contents.\n',
  },
];

const GITHUB_ISSUE_URL = 'https://github.com/painjanevivek/MoneyKai/issues/new';

const buildGitHubIssueUrl = (title: string, body: string) => {
  const params = new URLSearchParams({ title, body });
  return `${GITHUB_ISSUE_URL}?${params.toString()}`;
};

const buildMailtoUrl = (subject: string, body: string) => {
  const params = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return `mailto:${SITE.supportEmail}?${params}`;
};

export default function ContactScreen() {
  const { colors } = useTheme();
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

  const openGitHubIssue = (title: string, body: string) => {
    const url = buildGitHubIssueUrl(title, body);
    Linking.openURL(url).catch(() => {
      Linking.openURL('https://github.com/painjanevivek/MoneyKai/issues').catch(() => undefined);
    });
  };

  const openMail = (subject: string, body: string) => {
    Linking.openURL(buildMailtoUrl(subject, body)).catch(() => {
      Linking.openURL(`mailto:${SITE.supportEmail}`).catch(() => undefined);
    });
  };

  const handleSubmitFeedback = () => {
    const name = feedbackName.trim();
    const feedback = feedbackText.trim();

    if (!name || !feedback) {
      Alert.alert('Feedback needs a name and message', 'Add your name and feedback before submitting.');
      return;
    }

    openGitHubIssue(
      `Feedback: ${name}`,
      [
        `Name: ${name}`,
        '',
        'Feedback:',
        feedback,
      ].join('\n')
    );
  };

  return (
    <>
      <SeoHead
        title="Contact MoneyKai | GitHub support, feedback, and privacy questions"
        description="Contact MoneyKai through GitHub Issues for support, bug reports, product feedback, privacy questions, and security or data-related requests."
        path="/contact"
        keywords={['MoneyKai contact', 'MoneyKai support', 'MoneyKai bug report', 'privacy support', 'budget app support']}
      />
      <PublicShell
        eyebrow="Contact"
        title="Contact MoneyKai without hunting for the right route."
        description={`Use ${SITE.supportEmail} or GitHub Issues for support, bug reports, feedback, and privacy or security-related questions.`}
      >
        <View style={{ gap: Spacing.md }}>
          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Help and support
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              Email support or report a bug with enough context for MoneyKai to investigate safely. Do not include
              passwords, full card numbers, secrets, or sensitive document contents.
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
              {SITE.supportEmail}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md }}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => openMail('MoneyKai Support', 'What do you need help with?\n\nDevice/browser:\n\nScreenshots or links, if useful:\n')}
                accessibilityRole="button"
                accessibilityLabel="Email MoneyKai support"
                style={{
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 12,
                  borderRadius: BorderRadius.full,
                  backgroundColor: colors.primary,
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                  Email support
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => openMail('MoneyKai Bug Report', CONTACT_OPTIONS[1].issueBody)}
                accessibilityRole="button"
                accessibilityLabel="Email a MoneyKai bug report"
                style={{
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 12,
                  borderRadius: BorderRadius.full,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Bug report
                </Text>
              </TouchableOpacity>
            </View>
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
                  onPress={() => openGitHubIssue(option.issueTitle, option.issueBody)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open a GitHub issue about ${option.title.toLowerCase()}`}
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
                    Open GitHub issue
                  </Text>
                </TouchableOpacity>
              </SectionCard>
            ))}
          </View>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Feedback
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              Share product feedback without email. Submitting this form opens a prefilled GitHub issue for review.
            </Text>

            <View style={{ marginTop: Spacing.md, gap: Spacing.md }}>
              <View>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: 8 }}>
                  Name
                </Text>
                <TextInput
                  value={feedbackName}
                  onChangeText={setFeedbackName}
                  placeholder="Your name"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                  style={{
                    minHeight: 48,
                    borderRadius: BorderRadius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    paddingHorizontal: Spacing.md,
                    color: colors.textPrimary,
                    fontSize: Typography.fontSize.sm,
                    fontFamily: Typography.fontFamily.regular,
                  }}
                />
              </View>

              <View>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: 8 }}>
                  Feedback
                </Text>
                <TextInput
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  placeholder="Tell us what should improve, change, or be added."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  textAlignVertical="top"
                  style={{
                    minHeight: 140,
                    borderRadius: BorderRadius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.md,
                    color: colors.textPrimary,
                    fontSize: Typography.fontSize.sm,
                    lineHeight: 22,
                    fontFamily: Typography.fontFamily.regular,
                  }}
                />
              </View>

              <TouchableOpacity
                activeOpacity={0.82}
                onPress={handleSubmitFeedback}
                accessibilityRole="button"
                accessibilityLabel="Submit feedback through GitHub Issues"
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: 13,
                  borderRadius: BorderRadius.full,
                  backgroundColor: colors.primary,
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                  Submit feedback
                </Text>
              </TouchableOpacity>
            </View>
          </SectionCard>
        </View>
      </PublicShell>
    </>
  );
}
