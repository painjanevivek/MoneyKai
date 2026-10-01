import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { SITE } from '@/constants/site';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { AccountDeletionPanel } from '@/components/security/AccountDeletionPanel';

const path = '/account-deletion';
const title = 'Delete your MoneyKai account';
const description = 'Request deletion of your MoneyKai account and associated synced data, with or without access to the Android app.';

export function generateMetadata() {
  return {
    title: `${title} | MoneyKai`,
    description,
    robots: 'index,follow',
    alternates: { canonical: `${SITE.url}${path}` },
  };
}

export default function AccountDeletionPage() {
  const { colors } = useTheme();
  const subject = encodeURIComponent('MoneyKai account deletion request');
  const body = encodeURIComponent('Please delete my MoneyKai account and associated synced data.\n\nI am sending this request from the email address associated with my account. Please let me know the steps needed to verify ownership.');
  const emailHref = `mailto:${SITE.supportEmail}?subject=${subject}&body=${body}` as const;

  return (
    <>
      <SeoHead title={`${title} | MoneyKai`} description={description} path={path} />
      <PublicShell
        eyebrow="Your data"
        title={title}
        description="Delete your account and stored data after signing in, or request help if you cannot access your account. No sign-in is needed to read these instructions."
      >
        <View style={{ gap: Spacing.md }}>
          <AccountDeletionPanel />
          <SectionCard>
            <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' }}>
              <MaterialCommunityIcons name="cellphone-check" size={23} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text accessibilityRole="header" aria-level={2} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl }}>
                  If you can open the app
                </Text>
                <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, lineHeight: 22, marginTop: Spacing.sm }}>
                  Go to Profile → Security & data → Delete account. Export anything you want to keep, read the warning, and type DELETE to confirm. MoneyKai will sign you out only after its service verifies deletion of the account and synced data. If deletion cannot be verified, follow the error instructions or contact support.
                </Text>
              </View>
            </View>
          </SectionCard>
          <SectionCard>
            <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' }}>
              <MaterialCommunityIcons name="email-outline" size={23} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text accessibilityRole="header" aria-level={2} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl }}>
                  If you cannot access the app
                </Text>
                <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, lineHeight: 22, marginTop: Spacing.sm }}>
                  Email {SITE.supportEmail} from the address associated with your account and ask to delete your MoneyKai account and associated data. We may need to verify that the account is yours. Do not send your password or transaction details.
                </Text>
                <Link href={emailHref} asChild>
                  <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Email MoneyKai to request account deletion"
                  style={{ alignSelf: 'flex-start', justifyContent: 'center', minHeight: 48, marginTop: Spacing.md }}
                >
                  <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, textDecorationLine: 'underline' }}>
                    Email a deletion request
                  </Text>
                  </Pressable>
                </Link>
                <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, lineHeight: 22 }}>
                  This opens a draft in your email app; send it there to make your request. If no email app opens, write directly to {SITE.supportEmail}. Opening this page or the email draft does not delete your account.
                </Text>
              </View>
            </View>
          </SectionCard>
          <SectionCard>
            <Text accessibilityRole="header" aria-level={2} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl }}>
              What deletion covers
            </Text>
            <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, lineHeight: 22, marginTop: Spacing.sm }}>
              Deletion covers your account and associated profile, transactions, budgets, savings goals, shared-expense data and cloud backups. Deletion is permanent. Local copies on other devices, exported backups and files shared outside MoneyKai must be removed separately. Clearing app storage or uninstalling the app does not by itself request deletion of your cloud account.
            </Text>
            <Link href="/privacy-policy" asChild>
              <Pressable accessibilityRole="link" style={{ alignSelf: 'flex-start', justifyContent: 'center', minHeight: 48, marginTop: Spacing.sm }}>
                <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, textDecorationLine: 'underline' }}>
                  Read the privacy policy
                </Text>
              </Pressable>
            </Link>
          </SectionCard>
        </View>
      </PublicShell>
    </>
  );
}
