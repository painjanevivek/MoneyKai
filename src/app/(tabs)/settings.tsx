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
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { isFirebaseConfigured } from '@/services/firebase';
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

  const switchTrack = {
    false: colors.border,
    true: colors.primary,
  } as const;
  const switchThumb = colors.textInverse;

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
          void signOut();
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
        link.download = `moneykai_transactions_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({
          title: 'MoneyKai transactions CSV',
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
        ? 'https://apps.apple.com/search?term=MoneyKai'
        : 'https://play.google.com/store/search?q=MoneyKai&c=apps';
    Linking.openURL(url).catch(() => {
      Alert.alert('Rate the App', 'Search for MoneyKai in your app store to leave a review.');
    });
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@moneykai.app?subject=MoneyKai Support').catch(() => {
      Alert.alert('Contact Support', 'Email us at support@moneykai.app');
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

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <UserAvatar
              name={user?.full_name}
              email={user?.email}
              avatarUrl={user?.avatar_url}
              size={56}
            />
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
            iconColor="#111111"
            iconBg="#F4F4F4"
            title="Monthly Allowance"
            subtitle={allowanceSubtitle}
            onPress={() => {
              setAllowanceValue(String(settings.monthly_allowance));
              setShowAllowanceEditor(true);
            }}
          />
          <SettingItem
            icon="calendar-sync"
            iconColor="#2B2B2B"
            iconBg="#F2F2F2"
            title="Auto Reset"
            subtitle={`Resets on day ${settings.reset_day} of each month`}
            right={
              <Switch
                value={settings.auto_reset}
                onValueChange={(v) => updateSettings({ auto_reset: v })}
                trackColor={switchTrack}
                thumbColor={switchThumb}
                ios_backgroundColor={colors.borderLight}
              />
            }
          />
          <SettingItem
            icon="transfer"
            iconColor="#444444"
            iconBg="#ECECEC"
            title="Carry Forward"
            subtitle="Move unused balance to the next month"
            right={
              <Switch
                value={settings.carry_forward}
                onValueChange={(v) => updateSettings({ carry_forward: v })}
                trackColor={switchTrack}
                thumbColor={switchThumb}
                ios_backgroundColor={colors.borderLight}
              />
            }
          />
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Appearance</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem
            icon={isDark ? 'weather-night' : 'weather-sunny'}
            iconColor="#5A5A5A"
            iconBg="#EFEFEF"
            title="Dark Mode"
            subtitle={isDark ? 'Currently enabled' : 'Currently disabled'}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={switchTrack}
                thumbColor={switchThumb}
                ios_backgroundColor={colors.borderLight}
              />
            }
          />
          <SettingItem
            icon="currency-inr"
            iconColor="#707070"
            iconBg="#F1F1F1"
            title="Currency"
            subtitle={`${currency} (${currencySymbol})`}
          />
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Notifications</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem
            icon="bell-outline"
            iconColor="#8A8A8A"
            iconBg="#F2F2F2"
            title="Push Notifications"
            subtitle={notificationsEnabled ? 'Enabled' : 'Disabled'}
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={switchTrack}
                thumbColor={switchThumb}
                ios_backgroundColor={colors.borderLight}
              />
            }
          />
          <SettingItem
            icon="vibrate"
            iconColor="#A3A3A3"
            iconBg="#F2F2F2"
            title="Haptic Feedback"
            subtitle={hapticEnabled ? 'Enabled' : 'Disabled'}
            right={
              <Switch
                value={hapticEnabled}
                onValueChange={toggleHaptic}
                trackColor={switchTrack}
                thumbColor={switchThumb}
                ios_backgroundColor={colors.borderLight}
              />
            }
          />
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Data & Privacy</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem
            icon="download-outline"
            iconColor="#111111"
            iconBg="#F4F4F4"
            title="Export Data (CSV)"
            subtitle="Share your transactions as CSV"
            onPress={handleExport}
          />
          <SettingItem
            icon="cloud-upload-outline"
            iconColor="#2B2B2B"
            iconBg="#F2F2F2"
            title="Backup & Restore"
            subtitle="Save to or restore from cloud backup"
            onPress={() => setShowBackupSheet(true)}
          />
          <SettingItem
            icon="shield-lock-outline"
            iconColor="#444444"
            iconBg="#ECECEC"
            title="Privacy Policy"
            subtitle="Open the privacy policy"
            onPress={handlePrivacy}
          />
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>About</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem icon="information-outline" iconColor="#6B7280" iconBg="#F3F3F3" title="Version" subtitle="MoneyKai v1.0.0" />
          <SettingItem icon="star-outline" iconColor="#5A5A5A" iconBg="#EFEFEF" title="Rate the App" onPress={handleRate} />
          <SettingItem icon="help-circle-outline" iconColor="#707070" iconBg="#F1F1F1" title="Help & Support" onPress={handleSupport} />
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
        subtitle={isFirebaseConfigured() ? 'Create a cloud backup or restore the latest snapshot.' : 'Firebase is required for cloud backup.'}
        onClose={() => setShowBackupSheet(false)}
        footer={
          <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
            <Button
              title="Back Up Now"
              onPress={handleCloudBackup}
              loading={backupBusy}
              disabled={!isFirebaseConfigured()}
            />
            <Button
              title="Restore Latest Backup"
              onPress={handleCloudRestore}
              variant="outline"
              loading={backupBusy}
              disabled={!isFirebaseConfigured()}
            />
          </View>
        }
      >
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
          Cloud backups store your current transactions, notes, groups, challenges, badges, budget, and settings in Firebase so you can restore them on another device.
        </Text>
      </ModalSheet>
    </SafeAreaView>
  );
}

