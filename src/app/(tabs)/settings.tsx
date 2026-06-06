import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Linking, Platform, Share } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { isSupabaseConfigured } from '@/services/supabase';
import { saveCloudBackup, restoreLatestCloudBackup } from '@/services/backupService';
import { setNotificationEnabled } from '@/services/notificationService';

interface SettingItemProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, iconColor, iconBg, title, subtitle, right, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: BorderRadius.sm,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: Spacing.md,
        }}
      >
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>{title}</Text>
        {!!subtitle && <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {right || (onPress && <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />)}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuthStore();
  const { notificationsEnabled, hapticEnabled, toggleHaptic, currency, currencySymbol } = useSettingsStore();
  const { settings, updateSettings } = useBudgetStore();
  const transactions = useTransactionStore((s) => s.transactions);

  const [showAllowanceEditor, setShowAllowanceEditor] = useState(false);
  const [showBackupSheet, setShowBackupSheet] = useState(false);
  const [allowanceValue, setAllowanceValue] = useState(String(settings.monthly_allowance));
  const [savingAllowance, setSavingAllowance] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);

  const allowanceSubtitle = useMemo(
    () => `${currencySymbol} ${settings.monthly_allowance.toLocaleString('en-IN')}`,
    [currencySymbol, settings.monthly_allowance]
  );

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleExport = async () => {
    try {
      if (transactions.length === 0) {
        Alert.alert('No Data', 'You have no transactions to export.');
        return;
      }

      const header = 'Date,Type,Category,Description,Amount,Payment Method\n';
      const rows = transactions.map((t) =>
        [
          t.transaction_date,
          t.type,
          t.category,
          `"${t.description.replace(/"/g, '""')}"`,
          t.amount.toString(),
          t.payment_method ?? '',
        ].join(',')
      );
      const csv = header + rows.join('\n');

      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `smartpaisa_transactions_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({
          title: 'SmartPaisa transactions CSV',
          message: csv,
        });
      }
    } catch (err) {
      Alert.alert('Export Failed', err instanceof Error ? err.message : 'Could not export data.');
    }
  };

  const handlePrivacy = () => {
    router.push('/privacy-policy' as any);
  };

  const handleRate = () => {
    const url =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/search?term=SmartPaisa'
        : 'https://play.google.com/store/search?q=SmartPaisa&c=apps';
    Linking.openURL(url).catch(() => {
      Alert.alert('Rate the App', 'Search for SmartPaisa in your app store to leave a review.');
    });
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@smartpaisa.app?subject=SmartPaisa Support').catch(() => {
      Alert.alert('Contact Support', 'Email us at support@smartpaisa.app');
    });
  };

  const saveAllowance = async () => {
    const parsed = Number(allowanceValue.replace(/,/g, '').trim());
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert('Invalid Amount', 'Enter a positive monthly allowance.');
      return;
    }

    setSavingAllowance(true);
    try {
      updateSettings({ monthly_allowance: parsed });
      setShowAllowanceEditor(false);
    } finally {
      setSavingAllowance(false);
    }
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    const granted = await setNotificationEnabled(enabled);
    if (enabled && !granted) {
      Alert.alert('Permission denied', 'Turn on notifications from your device settings to receive alerts.');
    }
  };

  const handleCloudBackup = async () => {
    setBackupBusy(true);
    try {
      const snapshot = await saveCloudBackup();
      Alert.alert('Backup saved', `Cloud backup created at ${new Date(snapshot.capturedAt).toLocaleString()}.`);
      setShowBackupSheet(false);
    } catch (err) {
      Alert.alert('Backup failed', err instanceof Error ? err.message : 'Could not create a cloud backup.');
    } finally {
      setBackupBusy(false);
    }
  };

  const handleCloudRestore = async () => {
    setBackupBusy(true);
    try {
      await restoreLatestCloudBackup();
      Alert.alert('Backup restored', 'Your latest cloud backup is now on this device.');
      setShowBackupSheet(false);
    } catch (err) {
      Alert.alert('Restore failed', err instanceof Error ? err.message : 'Could not restore a cloud backup.');
    } finally {
      setBackupBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.base, paddingVertical: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>Settings</Text>
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary }}>Manage your account and preferences</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: '#FFF' }}>
                {user?.full_name?.[0]?.toUpperCase() || 'A'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{user?.full_name || 'Demo User'}</Text>
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>{user?.email || 'No email available'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile-edit' as any)}>
              <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Budget</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem
            icon="wallet-outline"
            iconColor="#0D8C4C"
            iconBg="#E8F5EE"
            title="Monthly Allowance"
            subtitle={allowanceSubtitle}
            onPress={() => {
              setAllowanceValue(String(settings.monthly_allowance));
              setShowAllowanceEditor(true);
            }}
          />
          <SettingItem
            icon="calendar-sync"
            iconColor="#3B82F6"
            iconBg="#EBF4FF"
            title="Auto Reset"
            subtitle={`Resets on day ${settings.reset_day} of each month`}
            right={<Switch value={settings.auto_reset} onValueChange={(v) => updateSettings({ auto_reset: v })} trackColor={{ true: colors.primary }} />}
          />
          <SettingItem
            icon="transfer"
            iconColor="#8B5CF6"
            iconBg="#F3EFFE"
            title="Carry Forward"
            subtitle="Move unused balance to the next month"
            right={<Switch value={settings.carry_forward} onValueChange={(v) => updateSettings({ carry_forward: v })} trackColor={{ true: colors.primary }} />}
          />
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Appearance</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem
            icon={isDark ? 'weather-night' : 'weather-sunny'}
            iconColor="#F59E0B"
            iconBg="#FEF9E7"
            title="Dark Mode"
            subtitle={isDark ? 'Currently enabled' : 'Currently disabled'}
            right={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: colors.primary }} />}
          />
          <SettingItem
            icon="currency-inr"
            iconColor="#14B8A6"
            iconBg="#E8FAF6"
            title="Currency"
            subtitle={`${currency} (${currencySymbol})`}
          />
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Notifications</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem
            icon="bell-outline"
            iconColor="#EC4899"
            iconBg="#FEF0F7"
            title="Push Notifications"
            subtitle={notificationsEnabled ? 'Enabled' : 'Disabled'}
            right={<Switch value={notificationsEnabled} onValueChange={handleNotificationsToggle} trackColor={{ true: colors.primary }} />}
          />
          <SettingItem
            icon="vibrate"
            iconColor="#6366F1"
            iconBg="#EEEFFD"
            title="Haptic Feedback"
            subtitle={hapticEnabled ? 'Enabled' : 'Disabled'}
            right={<Switch value={hapticEnabled} onValueChange={toggleHaptic} trackColor={{ true: colors.primary }} />}
          />
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Data & Privacy</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem
            icon="download-outline"
            iconColor="#0D8C4C"
            iconBg="#E8F5EE"
            title="Export Data (CSV)"
            subtitle="Share your transactions as CSV"
            onPress={handleExport}
          />
          <SettingItem
            icon="cloud-upload-outline"
            iconColor="#3B82F6"
            iconBg="#EBF4FF"
            title="Backup & Restore"
            subtitle="Save to or restore from cloud backup"
            onPress={() => setShowBackupSheet(true)}
          />
          <SettingItem
            icon="shield-lock-outline"
            iconColor="#8B5CF6"
            iconBg="#F3EFFE"
            title="Privacy Policy"
            subtitle="Open the privacy policy"
            onPress={handlePrivacy}
          />
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>About</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem icon="information-outline" iconColor="#6B7280" iconBg="#F3F4F6" title="Version" subtitle="SmartPaisa v1.0.0" />
          <SettingItem icon="star-outline" iconColor="#F59E0B" iconBg="#FEF9E7" title="Rate the App" onPress={handleRate} />
          <SettingItem icon="help-circle-outline" iconColor="#14B8A6" iconBg="#E8FAF6" title="Help & Support" onPress={handleSupport} />
        </Card>

        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: Spacing.base,
            borderRadius: BorderRadius.md,
            backgroundColor: colors.emergencyBg,
            borderWidth: 1,
            borderColor: `${colors.emergency}30`,
          }}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.emergency} />
          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.emergency }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <ModalSheet
        visible={showAllowanceEditor}
        title="Edit Monthly Allowance"
        subtitle="Update the budget used across your savings and dashboard calculations."
        onClose={() => setShowAllowanceEditor(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
            <Button
              title="Cancel"
              onPress={() => setShowAllowanceEditor(false)}
              variant="outline"
              style={{ flex: 1 }}
            />
            <Button
              title="Save"
              onPress={saveAllowance}
              loading={savingAllowance}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <Input
          label="Monthly allowance"
          placeholder="15000"
          value={allowanceValue}
          onChangeText={(value) => setAllowanceValue(value.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          prefix="₹"
        />
      </ModalSheet>

      <ModalSheet
        visible={showBackupSheet}
        title="Backup & Restore"
        subtitle={isSupabaseConfigured() ? 'Create a cloud backup or restore the latest snapshot.' : 'Supabase is required for cloud backup.'}
        onClose={() => setShowBackupSheet(false)}
        footer={
          <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
            <Button
              title="Back Up Now"
              onPress={handleCloudBackup}
              loading={backupBusy}
              disabled={!isSupabaseConfigured()}
            />
            <Button
              title="Restore Latest Backup"
              onPress={handleCloudRestore}
              variant="outline"
              loading={backupBusy}
              disabled={!isSupabaseConfigured()}
            />
          </View>
        }
      >
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
          Cloud backups store your current transactions, notes, groups, challenges, badges, budget, and settings in Supabase so you can restore them on another device.
        </Text>
      </ModalSheet>
    </SafeAreaView>
  );
}
