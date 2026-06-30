import React from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { SITE } from '@/constants/site';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ContactOption = {
  icon: string;
  title: string;
  description: string;
  subject: string;
  body: string;
};

const BUG_REPORT_BODY = [
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
  'Device model:',
  '',
  'Android/iOS version:',
  '',
  'MoneyKai version/build, if known:',
  '',
  'Screenshot or video link, if available:',
].join('\n');

const CONTACT_OPTIONS: ContactOption[] = [
  {
    icon: 'lifebuoy',
    title: 'Support',
    description: `Get help with local data, encrypted backup files, app behavior, or product questions through ${SITE.supportEmail}.`,
    subject: 'MoneyKai Support',
    body: 'What do you need help with?\n\nAccount email, if relevant:\n\nDevice model:\n',
  },
  {
    icon: 'bug-outline',
    title: 'Bug report',
    description: `Report crashes, freezes, incorrect totals, broken navigation, or backup-file issues to ${SITE.supportEmail}.`,
    subject: 'MoneyKai Bug Report',
    body: BUG_REPORT_BODY,
  },
  {
    icon: 'message-text-outline',
    title: 'Feedback',
    description: `Share feature ideas, confusing flows, or launch feedback with the MoneyKai team at ${SITE.supportEmail}.`,
    subject: 'MoneyKai Feedback',
    body: 'Feedback or idea:\n\nWhat problem would this solve for you?\n',
  },
  {
    icon: 'shield-lock-outline',
    title: 'Privacy and security',
    description: `Use ${SITE.supportEmail} for privacy questions, security concerns, or data-related requests.`,
    subject: 'MoneyKai Privacy and Security',
    body: 'Privacy, security, or data request:\n\nPlease avoid sending passwords, full card numbers, or sensitive document contents by email.\n',
  },
];

const buildMailtoUrl = (subject: string, body: string) => {
  const params = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return `mailto:${SITE.supportEmail}?${params}`;
};

export default function ContactScreen() {
  const { colors } = useTheme();

  const openMail = (option: ContactOption) => {
    Linking.openURL(buildMailtoUrl(option.subject, option.body)).catch(() => {
      Linking.openURL(`mailto:${SITE.supportEmail}`).catch(() => {
        Alert.alert('Email unavailable', `Email ${SITE.supportEmail} from your mail app.`);
      });
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.base,
          paddingBottom: Spacing['2xl'],
          paddingTop: Spacing.base,
        }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/settings' as any))}
          style={{ alignSelf: 'flex-start', marginBottom: Spacing.md, padding: Spacing.xs }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={{ gap: Spacing.xs, marginBottom: Spacing.lg }}>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
            HELP AND FEEDBACK
          </Text>
          <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
            Contact MoneyKai
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
            Use {SITE.supportEmail} for support, bug reports, product feedback, privacy questions, and security concerns.
          </Text>
        </View>

        <Card style={{ marginBottom: Spacing.lg }}>
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Support email
          </Text>
          <Text style={{ marginTop: Spacing.xs, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
            MoneyKai uses a direct email feedback loop during internal testing and launch readiness.
          </Text>
          <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
            {SITE.supportEmail}
          </Text>
        </Card>

        <View style={{ gap: Spacing.md }}>
          {CONTACT_OPTIONS.map((option) => (
            <Card key={option.title}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: BorderRadius.sm,
                    backgroundColor: colors.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name={option.icon as any} size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {option.title}
                  </Text>
                  <Text style={{ marginTop: 4, fontSize: Typography.fontSize.sm, lineHeight: 21, color: colors.textSecondary }}>
                    {option.description}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Email MoneyKai about ${option.title.toLowerCase()}`}
                activeOpacity={0.82}
                onPress={() => openMail(option)}
                style={{
                  minHeight: 44,
                  alignSelf: 'flex-start',
                  justifyContent: 'center',
                  marginTop: Spacing.md,
                  paddingHorizontal: Spacing.md,
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
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
