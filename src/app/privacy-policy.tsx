import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.base, paddingVertical: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
          Privacy Policy
        </Text>
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
          SmartPaisa keeps your financial data private and under your control.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 100 }}>
        <View style={{ backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.base, gap: Spacing.md }}>
          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Data we store
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
            Your profile, transactions, notes, groups, challenges, badges, budget settings, and notification preferences may be stored locally on your device and, when you choose to back up, in your connected Supabase project.
          </Text>

          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            How we use it
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
            SmartPaisa uses your data only to power budgeting, insights, reminders, and optional cloud backup and restore.
          </Text>

          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Sharing
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
            We do not sell your data. Backup data stays in your own Supabase project and is only accessible to your authenticated account.
          </Text>

          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Contact
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
            Questions? Email support@smartpaisa.app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

