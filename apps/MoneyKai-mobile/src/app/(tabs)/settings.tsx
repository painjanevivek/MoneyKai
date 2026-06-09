import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Linking, Platform, Share, AppState } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { MonthlyReset } from '@/components/dashboard/MonthlyReset';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { isFirebaseConfigured } from '@/services/firebase';
import { isBackendConfigured } from '@/services/backendApi';
import { saveCloudBackup, restoreLatestCloudBackup } from '@/services/backupService';
import { setNotificationEnabled } from '@/services/notificationService';
import {
  clearNativeCaptureQueue,
  getNativeCaptureStatus,
  openNativeCaptureSettings,
  setNativeCaptureEnabled,
  type NativeCaptureStatus,
} from '@/services/nativeCaptureBridge';
import { getStoreReviewUrl, isSmsResearchBuildEnabled } from '@/config/environment';
import type { CaptureSourceStatus } from '@/types/capture';

interface SettingItemProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, iconColor, iconBg, title, subtitle, right, onPress, disabled }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress && !disabled ? 0.6 : 1}
      disabled={disabled}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        opacity: disabled ? 0.55 : 1,
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
      {right || (onPress && !disabled && <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />)}
    </TouchableOpacity>
  );
};

const sourceStatusLabel: Record<CaptureSourceStatus, string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
  needs_android_access: 'Needs Android access',
  research_only: 'Research only',
  unsupported: 'Unsupported',
};

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuthStore();
  const { notificationsEnabled, hapticEnabled, toggleHaptic, currency, currencySymbol, appLockEnabled, setAppLockEnabled } = useSettingsStore();
  const { settings, updateSettings } = useBudgetStore();
  const transactions = useTransactionStore((s) => s.transactions);
  const captureSettings = useCaptureStore((s) => s.settings);
  const pendingCaptureDrafts = useCaptureStore((s) => s.drafts.filter((draft) => draft.status === 'pending').length);
  const captureInboxCount = useCaptureStore((s) =>
    s.signals.filter((signal) => signal.processingStatus !== 'confirmed').length +
    s.drafts.filter((draft) => draft.status !== 'confirmed').length
  );
  const setAutoCaptureEnabled = useCaptureStore((s) => s.setAutoCaptureEnabled);
  const setNotificationCaptureEnabled = useCaptureStore((s) => s.setNotificationCaptureEnabled);
  const setReviewNotificationsEnabled = useCaptureStore((s) => s.setReviewNotificationsEnabled);
  const setSmsResearchModeEnabled = useCaptureStore((s) => s.setSmsResearchModeEnabled);
  const acceptNotificationExplainer = useCaptureStore((s) => s.acceptNotificationExplainer);
  const setNotificationAccessStatus = useCaptureStore((s) => s.setNotificationAccessStatus);
  const disableAutoCapture = useCaptureStore((s) => s.disableAutoCapture);
  const clearCaptureInbox = useCaptureStore((s) => s.clearCaptureInbox);
  const syncStatus = useSyncStore((s) => s.status);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const syncError = useSyncStore((s) => s.error);

  const [showAllowanceEditor, setShowAllowanceEditor] = useState(false);
  const [showBackupSheet, setShowBackupSheet] = useState(false);
  const [showSignOutSheet, setShowSignOutSheet] = useState(false);
  const [showNotificationExplainer, setShowNotificationExplainer] = useState(false);
  const [nativeCaptureStatus, setNativeCaptureStatus] = useState<NativeCaptureStatus | null>(null);
  const [allowanceValue, setAllowanceValue] = useState(String(settings.monthly_allowance));
  const [savingAllowance, setSavingAllowance] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [nativeStatusBusy, setNativeStatusBusy] = useState(false);
  const smsResearchBuildEnabled = isSmsResearchBuildEnabled();

  const switchTrack = {
    false: colors.border,
    true: colors.primary,
  } as const;
  const switchThumb = colors.textInverse;

  const allowanceSubtitle = useMemo(
    () => `${currencySymbol} ${settings.monthly_allowance.toLocaleString('en-IN')}`,
    [currencySymbol, settings.monthly_allowance]
  );

  const notificationSourceStatus = useMemo<CaptureSourceStatus>(() => {
    if (Platform.OS !== 'android') return 'unsupported';
    if (!captureSettings.autoCaptureEnabled || !captureSettings.notificationCaptureEnabled) return 'disabled';
    if ((nativeCaptureStatus?.notificationAccess ?? captureSettings.notificationAccessStatus) !== 'granted') {
      return 'needs_android_access';
    }
    return 'enabled';
  }, [
    captureSettings.autoCaptureEnabled,
    captureSettings.notificationAccessStatus,
    captureSettings.notificationCaptureEnabled,
    nativeCaptureStatus?.notificationAccess,
  ]);

  const smsSourceStatus = useMemo<CaptureSourceStatus>(() => {
    if (!smsResearchBuildEnabled) return 'unsupported';
    if (!captureSettings.autoCaptureEnabled || !captureSettings.smsResearchModeEnabled) return 'disabled';
    return 'research_only';
  }, [captureSettings.autoCaptureEnabled, captureSettings.smsResearchModeEnabled, smsResearchBuildEnabled]);

  const refreshNativeCaptureStatus = useCallback(async (showBusy = true) => {
    if (showBusy) {
      setNativeStatusBusy(true);
    }
    try {
      const status = await getNativeCaptureStatus();
      setNativeCaptureStatus(status);
      setNotificationAccessStatus(status.notificationAccess);
    } finally {
      if (showBusy) {
        setNativeStatusBusy(false);
      }
    }
  }, [setNotificationAccessStatus]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void refreshNativeCaptureStatus(false);
    }, 0);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshNativeCaptureStatus(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.remove();
    };
  }, [refreshNativeCaptureStatus]);

  const handleSignOut = async () => {
    if (signOutBusy) return;
    setSignOutBusy(true);
    try {
      await signOut();
      setShowSignOutSheet(false);
      router.replace('/login');
    } catch (err) {
      Alert.alert('Sign out failed', err instanceof Error ? err.message : 'Could not sign out right now.');
    } finally {
      setSignOutBusy(false);
    }
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
    const url = getStoreReviewUrl(Platform.OS === 'ios' ? 'ios' : 'android');
    Linking.openURL(url).catch(() => {
      Alert.alert('Rate the App', 'Open the store listing for MoneyKai to leave a review.');
    });
  };

  const handleSupport = () => {
    router.push('/contact' as any);
  };

  const saveAllowance = async () => {
    const parsed = Number(allowanceValue.replace(/,/g, '').trim());
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive monthly budget.');
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

  const handleAutoCaptureToggle = (enabled: boolean) => {
    setAutoCaptureEnabled(enabled);
    if (enabled) {
      Alert.alert(
        'Auto capture enabled',
        'MoneyKai will create reviewable drafts from supported transaction signals. Grant Android notification access only if you want bank and payment notifications to be used.'
      );
    } else {
      void setNativeCaptureEnabled(false);
      void clearNativeCaptureQueue();
    }
  };

  const handleOpenNativeCaptureSettings = async () => {
    if (!captureSettings.notificationExplainerAcceptedAt) {
      setShowNotificationExplainer(true);
      return;
    }

    const opened = await openNativeCaptureSettings();
    if (!opened) {
      Alert.alert('Android build required', 'Install a MoneyKai Android development build to grant notification access for automatic capture.');
      return;
    }
    setTimeout(() => void refreshNativeCaptureStatus(), 750);
  };

  const handleAcceptNotificationExplainer = async () => {
    acceptNotificationExplainer();
    setShowNotificationExplainer(false);
    const opened = await openNativeCaptureSettings();
    if (!opened) {
      Alert.alert('Android build required', 'Install a MoneyKai Android development build to grant notification access for automatic capture.');
      return;
    }
    setTimeout(() => void refreshNativeCaptureStatus(), 750);
  };

  const handleDisableAutoCapture = () => {
    Alert.alert(
      'Disable auto capture?',
      'MoneyKai will stop listening for new capture signals. Existing confirmed transactions will stay in your history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: () => {
            disableAutoCapture();
            void setNativeCaptureEnabled(false);
            void clearNativeCaptureQueue();
          },
        },
      ]
    );
  };

  const handleClearCaptureHistory = () => {
    if (captureInboxCount === 0) {
      Alert.alert('Nothing to clear', 'There are no pending or ignored capture items to remove.');
      return;
    }

    Alert.alert(
      'Clear capture history?',
      'This removes pending and ignored capture drafts and signals. Confirmed transactions stay in your transaction history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearCaptureInbox();
            void clearNativeCaptureQueue();
          },
        },
      ]
    );
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
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{user?.full_name || 'Your profile'}</Text>
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
            title="Monthly Budget"
            subtitle={allowanceSubtitle}
            onPress={() => {
              setAllowanceValue(String(settings.monthly_allowance));
              setShowAllowanceEditor(true);
            }}
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

        <View style={{ marginBottom: Spacing.lg }}>
          <MonthlyReset />
        </View>

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

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Auto Capture</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <View
            style={{
              paddingBottom: Spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderLight,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
              Auto Capture creates reviewable drafts only. Supported notification text is parsed into safe fields on this device, and unrelated alerts are ignored.
            </Text>
          </View>
          <SettingItem
            icon="radar"
            iconColor="#111111"
            iconBg="#F4F4F4"
            title="Automatic Capture"
            subtitle={captureSettings.autoCaptureEnabled ? `${pendingCaptureDrafts} drafts waiting for review` : 'Create drafts from supported transaction alerts'}
            right={
              <Switch
                value={captureSettings.autoCaptureEnabled}
                onValueChange={handleAutoCaptureToggle}
                trackColor={switchTrack}
                thumbColor={switchThumb}
                ios_backgroundColor={colors.borderLight}
              />
            }
          />
          <SettingItem
            icon="bell-badge-outline"
            iconColor="#444444"
            iconBg="#ECECEC"
            title="Bank Notifications"
            subtitle={`${sourceStatusLabel[notificationSourceStatus]} | Optional Android notification source`}
            right={
              <Switch
                value={captureSettings.notificationCaptureEnabled}
                onValueChange={setNotificationCaptureEnabled}
                disabled={!captureSettings.autoCaptureEnabled || Platform.OS !== 'android'}
                trackColor={switchTrack}
                thumbColor={switchThumb}
                ios_backgroundColor={colors.borderLight}
              />
            }
          />
          {Platform.OS === 'android' ? (
            <SettingItem
              icon="cellphone-cog"
              iconColor="#444444"
              iconBg="#ECECEC"
              title="Android Notification Access"
              subtitle={
                nativeStatusBusy
                  ? 'Checking access status'
                  : notificationSourceStatus === 'enabled'
                    ? 'Granted for MoneyKai'
                    : 'Required before notification drafts can be created'
              }
              onPress={handleOpenNativeCaptureSettings}
              disabled={!captureSettings.autoCaptureEnabled}
            />
          ) : null}
          <SettingItem
            icon="message-processing-outline"
            iconColor="#5A5A5A"
            iconBg="#EFEFEF"
            title="SMS Research Mode"
            subtitle={
              smsResearchBuildEnabled
                ? `${sourceStatusLabel[smsSourceStatus]} | Internal paste/import only`
                : `${sourceStatusLabel[smsSourceStatus]} | Not available in production controls`
            }
            right={
              <Switch
                value={captureSettings.smsResearchModeEnabled}
                onValueChange={setSmsResearchModeEnabled}
                disabled={!smsResearchBuildEnabled}
                trackColor={switchTrack}
                thumbColor={switchThumb}
                ios_backgroundColor={colors.borderLight}
              />
            }
          />
          <SettingItem
            icon="clipboard-check-outline"
            iconColor="#707070"
            iconBg="#F1F1F1"
            title="Review Alerts"
            subtitle={captureSettings.reviewNotificationsEnabled ? 'MoneyKai will notify when drafts need review' : 'Drafts stay quiet in the review inbox'}
            right={
              <Switch
                value={captureSettings.reviewNotificationsEnabled}
                onValueChange={setReviewNotificationsEnabled}
                trackColor={switchTrack}
                thumbColor={switchThumb}
                ios_backgroundColor={colors.borderLight}
              />
            }
          />
          <SettingItem
            icon="inbox-arrow-down-outline"
            iconColor="#8A8A8A"
            iconBg="#F2F2F2"
            title="Review Captured Drafts"
            subtitle={`${pendingCaptureDrafts} pending`}
            onPress={() => router.push('/(tabs)/auto-capture' as any)}
          />
          <SettingItem
            icon="capture"
            iconColor="#8A8A8A"
            iconBg="#F2F2F2"
            title="Disable Auto Capture"
            subtitle="Stop new capture signals immediately"
            onPress={handleDisableAutoCapture}
            disabled={!captureSettings.autoCaptureEnabled}
          />
          <SettingItem
            icon="trash-can-outline"
            iconColor={colors.emergency}
            iconBg={colors.emergencyBg}
            title="Clear Capture History"
            subtitle={`${captureInboxCount} pending or ignored items`}
            onPress={handleClearCaptureHistory}
          />
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Data & Privacy</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem
            icon="cloud-sync-outline"
            iconColor="#111111"
            iconBg="#F4F4F4"
            title="Cloud Sync"
            subtitle={
              syncStatus === 'syncing'
                ? 'Syncing your data now'
                : syncStatus === 'failed'
                  ? syncError ?? 'Last sync failed'
                  : lastSyncedAt
                    ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
                    : 'Not synced yet'
            }
          />
          <SettingItem
            icon="shield-lock-outline"
            iconColor="#111111"
            iconBg="#F4F4F4"
            title="App Lock"
            subtitle={appLockEnabled ? 'Biometric lock enabled' : 'Biometric lock disabled'}
            right={
              <Switch
                value={appLockEnabled}
                onValueChange={setAppLockEnabled}
                trackColor={switchTrack}
                thumbColor={switchThumb}
                ios_backgroundColor={colors.borderLight}
              />
            }
          />
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
            title="Cloud backups"
            subtitle="Save to or restore a cloud backup"
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
          <SettingItem
            icon="help-circle-outline"
            iconColor="#707070"
            iconBg="#F1F1F1"
            title="Help & Support"
            subtitle="Open contact and support options"
            onPress={handleSupport}
          />
        </Card>

          <TouchableOpacity
          onPress={() => setShowSignOutSheet(true)}
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
        title="Edit Monthly Budget"
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
          label="Monthly budget"
          placeholder="15000"
          value={allowanceValue}
          onChangeText={(value) => setAllowanceValue(value.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          prefix="₹"
        />
      </ModalSheet>

      <ModalSheet
        visible={showNotificationExplainer}
        title="Android notification access"
        subtitle="MoneyKai needs Android notification access only if you want supported bank and payment alerts turned into reviewable drafts."
        onClose={() => setShowNotificationExplainer(false)}
        footer={
          <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
            <Button
              title="Open Android Settings"
              icon="cellphone-cog"
              onPress={handleAcceptNotificationExplainer}
            />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Button
                title="Not Now"
                onPress={() => setShowNotificationExplainer(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title="Learn More"
                onPress={() => {
                  setShowNotificationExplainer(false);
                  router.push('/privacy-policy' as any);
                }}
                variant="ghost"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        }
      >
        <View style={{ gap: Spacing.md }}>
          {[
            'MoneyKai only uses supported transaction-like alerts to create drafts for your review.',
            'Drafts do not change budgets or transaction history until you confirm them.',
            'Full raw notification payloads are not shown by default; MoneyKai stores parsed fields and safe explanation details.',
            'You can disable Auto Capture or clear pending capture history from this screen.',
          ].map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </ModalSheet>

      <ModalSheet
        visible={showBackupSheet}
        title="Cloud backups"
        subtitle={
          isBackendConfigured()
            ? 'Make sure the MoneyKai backend is running and Firestore is available for cloud backups.'
            : isFirebaseConfigured()
              ? 'Create Firestore once in Firebase Console before your first cloud backup.'
              : 'Firebase is required for cloud backups.'
        }
        onClose={() => setShowBackupSheet(false)}
        footer={
          <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
            <Button
              title="Back Up Now"
              onPress={handleCloudBackup}
              loading={backupBusy}
              disabled={!isFirebaseConfigured() && !isBackendConfigured()}
            />
            <Button
              title="Restore Latest Backup"
              onPress={handleCloudRestore}
              variant="outline"
              loading={backupBusy}
              disabled={!isFirebaseConfigured() && !isBackendConfigured()}
            />
          </View>
        }
      >
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
            Cloud backups store your current transactions, notes, groups, challenges, badges, budget, and settings in Firebase so you can restore them on another device.
          </Text>
          <View style={{
            padding: Spacing.md,
            borderRadius: BorderRadius.md,
            backgroundColor: colors.primaryBg,
            borderWidth: 1,
            borderColor: `${colors.primary}22`,
          }}>
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary, marginBottom: 4 }}>
              First backup checklist
            </Text>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
              1. The MoneyKai backend is deployed and reachable.{"\n"}
              2. Firestore database exists in Firebase Console.{"\n"}
              3. You are signed in to MoneyKai with a real Firebase account.{"\n"}
              4. Firestore permissions allow the backend service account to store backups.
            </Text>
          </View>
        </View>
      </ModalSheet>

      <ModalSheet
        visible={showSignOutSheet}
        title="Sign out"
        subtitle="You will need to sign in again to access your MoneyKai account on this device."
        onClose={() => (signOutBusy ? undefined : setShowSignOutSheet(false))}
        footer={
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
            <Button
              title="Cancel"
              onPress={() => setShowSignOutSheet(false)}
              variant="outline"
              style={{ flex: 1 }}
              disabled={signOutBusy}
            />
            <Button
              title="Sign Out"
              onPress={handleSignOut}
              loading={signOutBusy}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22 }}>
          This will clear your local session and take you back to the login screen.
        </Text>
      </ModalSheet>
    </SafeAreaView>
  );
}



