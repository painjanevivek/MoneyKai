import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();

  return (
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
            Privacy Policy
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
            MoneyKai keeps your financial data private and under your control.
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 100 }}>
        <View style={{ backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.base, gap: Spacing.md }}>
          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Data we store
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
            Your profile, transactions, notes, groups, challenges, badges, budget settings, and notification preferences may be stored locally on your device and, when you choose to back up, in your connected Firebase project.
          </Text>

          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            How we use it
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
            MoneyKai uses your data only to power budgeting, insights, reminders, and optional cloud backup and restore.
          </Text>

          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Sharing
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
            We do not sell your data. Backup data stays in your own Firebase project and is only accessible to your authenticated account.
          </Text>

          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Contact
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
            Questions? Email support@moneykai.app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

