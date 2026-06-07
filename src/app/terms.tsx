import React from 'react';
import Head from 'expo-router/head';
import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const LAST_UPDATED = 'June 7, 2026';

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  const { colors } = useTheme();

  return (
    <Card style={{ gap: Spacing.sm }}>
      <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
        {title}
      </Text>
      {children}
    </Card>
  );
}

function BodyText({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 21, color: colors.textSecondary }}>
      {children}
    </Text>
  );
}

export default function TermsScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Head>
        <title>Terms of Use | MoneyKai</title>
        <meta
          name="description"
          content="Read the basic terms of use for MoneyKai, including account responsibility, service availability, and product limitations."
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
              Terms of Use
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
              Basic terms for using MoneyKai.
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: 120, gap: Spacing.lg }}
        >
          <Card
            style={{
              gap: Spacing.sm,
              backgroundColor: colors.primaryBg,
              borderWidth: 1,
              borderColor: `${colors.primary}18`,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Terms of Use
            </Text>
            <BodyText>
              These terms are meant to explain, in a simple and general way, how MoneyKai can be used and what users should understand when relying on the app.
            </BodyText>
          </Card>

          <Section title="Acceptance of terms">
            <BodyText>
              By using MoneyKai, you agree to these Terms of Use. If you do not agree with them, you should stop using the app.
            </BodyText>
          </Section>

          <Section title="Use of MoneyKai">
            <BodyText>
              MoneyKai is intended to help users organize, review, and better understand personal finance information such as budgets, transactions, savings progress, and shared expenses.
            </BodyText>
            <BodyText>
              You agree to use the app in a lawful and reasonable way and not to misuse its features or interfere with the experience of other users.
            </BodyText>
          </Section>

          <Section title="Account responsibility">
            <BodyText>
              If you create or use an account with MoneyKai, you are responsible for the information connected to that account and for helping keep your access credentials secure.
            </BodyText>
          </Section>

          <Section title="User data responsibility">
            <BodyText>
              You are responsible for the accuracy of the information you enter into MoneyKai, including budget details, transaction records, group expenses, and backup-related actions.
            </BodyText>
            <BodyText>
              Before relying on app records for important decisions, users should review their entries and confirm that the information is complete and current.
            </BodyText>
          </Section>

          <Section title="No professional financial advice">
            <BodyText>
              MoneyKai helps users organize and understand personal finance information, but it does not provide professional financial, investment, legal, or tax advice.
            </BodyText>
            <BodyText>
              Any information, calculations, summaries, or insights shown in the app should be treated as general product functionality and not as professional advice.
            </BodyText>
          </Section>

          <Section title="Service availability">
            <BodyText>
              MoneyKai may change over time. Features may be updated, improved, removed, or temporarily unavailable, including during maintenance, bugs, connectivity issues, or product changes.
            </BodyText>
          </Section>

          <Section title="Limitations">
            <BodyText>
              MoneyKai is provided as a general finance organization tool. While the goal is to make the service useful and reliable, the app may contain errors, delays, or incomplete information.
            </BodyText>
            <BodyText>
              Users should use their own judgment before relying on the app for important decisions, records, or time-sensitive actions.
            </BodyText>
          </Section>

          <Section title="Changes to terms">
            <BodyText>
              These terms may be updated from time to time. Continued use of MoneyKai after changes are published means you accept the updated terms.
            </BodyText>
          </Section>

          <Section title="Contact">
            <BodyText>
              If you have questions about these terms, you can contact the MoneyKai team through the contact page.
            </BodyText>
            <Button title="Open Contact Page" onPress={() => router.push('/contact' as any)} icon="arrow-right" iconPosition="right" />
          </Section>

          <Card
            variant="outlined"
            style={{
              gap: Spacing.xs,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: BorderRadius.lg,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Last updated
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
              {LAST_UPDATED}
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
