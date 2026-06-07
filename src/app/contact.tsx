import React from 'react';
import Head from 'expo-router/head';
import { router } from 'expo-router';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const SUPPORT_EMAIL = 'support@moneykai.app';

type ContactCardProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  ctaLabel: string;
  onPress: () => void;
};

function ContactCard({ icon, title, description, ctaLabel, onPress }: ContactCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={{ gap: Spacing.md }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: BorderRadius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryBg,
        }}
      >
        <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
          {title}
        </Text>
        <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
          {description}
        </Text>
      </View>
      <Button title={ctaLabel} onPress={onPress} variant="outline" icon="open-in-new" />
    </Card>
  );
}

export default function ContactScreen() {
  const { colors } = useTheme();

  const openMail = (subject: string) => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
    Linking.openURL(url).catch(() => {
      // Keep a readable fallback when mailto handlers are unavailable.
      Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => undefined);
    });
  };

  return (
    <>
      <Head>
        <title>Contact MoneyKai</title>
        <meta
          name="description"
          content="Contact the MoneyKai team for support, feedback, account questions, privacy concerns, and security or data-related requests."
        />
      </Head>

      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.md,
            paddingHorizontal: Spacing.base,
            paddingVertical: Spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Contact MoneyKai
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
              Have a question, issue, or feedback? Contact the MoneyKai team.
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: 120, gap: Spacing.lg }}>
          <Card
            style={{
              gap: Spacing.sm,
              backgroundColor: colors.primaryBg,
              borderWidth: 1,
              borderColor: `${colors.primary}18`,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Contact options
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
              MoneyKai currently uses a simple email-based support path, so you can reach the team directly without filling out a separate form.
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
              {SUPPORT_EMAIL}
            </Text>
          </Card>

          <ContactCard
            icon="lifebuoy"
            title="Support email"
            description="Reach out for app issues, account help, troubleshooting, or general product questions."
            ctaLabel="Email support"
            onPress={() => openMail('MoneyKai Support')}
          />

          <ContactCard
            icon="message-text-outline"
            title="Feedback"
            description="Share feature ideas, product feedback, or anything you would like to see improved in MoneyKai."
            ctaLabel="Send feedback"
            onPress={() => openMail('MoneyKai Feedback')}
          />

          <ContactCard
            icon="shield-lock-outline"
            title="Security and privacy"
            description="Use this path for security concerns, privacy questions, or anything related to your account data."
            ctaLabel="Report a concern"
            onPress={() => openMail('MoneyKai Security and Privacy')}
          />

          <Card
            style={{
              gap: Spacing.sm,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            variant="outlined"
          >
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Data-related note
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
              For account, privacy, or data-related questions, users can contact the MoneyKai team through this page.
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
