import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function AccountsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { notificationsEnabled, hapticEnabled, currency, currencySymbol } = useSettingsStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['4xl'] }}
      >
        <View style={{ gap: Spacing.xl }}>
          <Card>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Accounts
            </Text>
            <Text style={{ marginTop: 6, fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22, maxWidth: 760 }}>
              MoneyKai does not fake bank linking yet. This page keeps account-related profile and app preferences in one place until a real accounts system is added.
            </Text>
          </Card>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
            <Card style={{ flex: 1, minWidth: 240 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Profile</Text>
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginTop: 4 }}>
                {user?.full_name || 'Signed in user'}
              </Text>
              <Text style={{ marginTop: 2, fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
                {user?.email || 'No email available'}
              </Text>
            </Card>
            <Card style={{ flex: 1, minWidth: 240 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Currency</Text>
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginTop: 4 }}>
                {currencySymbol} {currency}
              </Text>
            </Card>
            <Card style={{ flex: 1, minWidth: 240 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Notifications</Text>
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginTop: 4 }}>
                {notificationsEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </Card>
            <Card style={{ flex: 1, minWidth: 240 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Haptics</Text>
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginTop: 4 }}>
                {hapticEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </Card>
          </View>

          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="bank-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  No linked bank accounts yet
                </Text>
                <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, marginTop: 2, lineHeight: 22 }}>
                  When MoneyKai adds a real accounts layer, it should connect here without changing the rest of the dashboard.
                </Text>
              </View>
            </View>
          </Card>

          <Card>
            <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
              Quick actions
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              <Button title="Edit profile" onPress={() => router.push('/profile-edit' as any)} variant="outline" />
              <Button title="Open Settings" onPress={() => router.push('/settings' as any)} />
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
