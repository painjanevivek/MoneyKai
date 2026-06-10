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
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { isFirebaseConfigured } from '@/services/firebase';
import { isBackendConfigured } from '@/services/backendApi';
import { saveCloudBackup, restoreLatestCloudBackup } from '@/services/backupService';
import { setNotificationEnabled } from '@/services/notificationService';
import {
  clearNativeCaptureQueue,
  getNativeCaptureStatus,
  openNativeCaptureSettings,
  requestNativeSmsPermission,
  setNativeCaptureEnabled,
  setNativeCaptureSourcesEnabled,
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
  const setSmsResearchModeEnabled = useCaptureStore((s) => s.setSmsResearchModeEnabled);
  const acceptNotificationExplainer = useCaptureStore((s) => s.acceptNotificationExplainer);
  const acceptSmsResearchExplainer = useCaptureStore((s) => s.acceptSmsResearchExplainer);
  const setNotificationAccessStatus = useCaptureStore((s) => s.setNotificationAccessStatus);
  const setSmsAccessStatus = useCaptureStore((s) => s.setSmsAccessStatus);
  const clearCaptureInbox = useCaptureStore((s) => s.clearCaptureInbox);
  const clearSmsResearchData = useCaptureStore((s) => s.clearSmsResearchData);
  const syncStatus = useSyncStore((s) => s.status);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const syncError = useSyncStore((s) => s.error);

  const [showAllowanceEditor, setShowAllowanceEditor] = useState(false);
  const [showBackupSheet, setShowBackupSheet] = useState(false);
  const [showSignOutSheet, setShowSignOutSheet] = useState(false);
  const [showNotificationExplainer, setShowNotificationExplainer] = useState(false);
  const [showSmsResearchExplainer, setShowSmsResearchExplainer] = useState(false);
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
    const smsReceiveAccess = nativeCaptureStatus?.smsAccess ?? captureSettings.smsAccessStatus ?? 'unknown';
    const smsInboxAccess = nativeCaptureStatus?.smsInboxAccess ?? captureSettings.smsAccessStatus ?? 'unknown';
    if (smsReceiveAccess !== 'granted' || smsInboxAccess !== 'granted') {
      return 'needs_android_access';
    }
    return 'enabled';
  }, [
    captureSettings.autoCaptureEnabled,
    captureSettings.smsAccessStatus,
    captureSettings.smsResearchModeEnabled,
    nativeCaptureStatus?.smsAccess,
    nativeCaptureStatus?.smsInboxAccess,
    smsResearchBuildEnabled,
  ]);

  const refreshNativeCaptureStatus = useCallback(async (showBusy = true) => {
    if (showBusy) {
      setNativeStatusBusy(true);
    }
    try {
      const status = await getNativeCaptureStatus();
      const smsStatus =
        status.smsAccess === 'granted' && (status.smsInboxAccess ?? status.smsAccess) === 'granted'
          ? 'granted'
          : status.smsAccess === 'unsupported' || status.smsInboxAccess === 'unsupported'
            ? 'unsupported'
            : 'denied';
      setNativeCaptureStatus(status);
      setNotificationAccessStatus(status.notificationAccess);
      setSmsAccessStatus(smsStatus);
    } finally {
      if (showBusy) {
        setNativeStatusBusy(false);
      }
    }
  }, [setNotificationAccessStatus, setSmsAccessStatus]);

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

  const handleAutoCaptureToggle = async (enabled: boolean) => {
    if (!enabled) {
      setAutoCaptureEnabled(false);
      void setNativeCaptureEnabled(false);
      void clearNativeCaptureQueue();
      return;
    }

    let smsCaptureEnabledForAlert = smsResearchBuildEnabled && captureSettings.smsResearchModeEnabled;

    if (smsCaptureEnabledForAlert) {
      const hasSmsAccess = await requestSmsAccessForResearch();
      if (!hasSmsAccess) {
        smsCaptureEnabledForAlert = false;
        setSmsResearchModeEnabled(false);
        disableNativeSmsCapture();
      }
    }

    setAutoCaptureEnabled(true);
    Alert.alert(
      'Auto capture enabled',
      smsCaptureEnabledForAlert
        ? 'MoneyKai will create reviewable drafts from supported transaction signals. SMS access is requested now because recent SMS import is restricted to explicit Android permission.'
        : 'MoneyKai will create reviewable drafts from supported transaction signals. Grant Android notification access only if you want bank and payment notifications to be used.'
    );
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

  const disableNativeSmsCapture = () => {
    void setNativeCaptureSourcesEnabled({
      notificationEnabled: captureSettings.autoCaptureEnabled && captureSettings.notificationCaptureEnabled,
      smsEnabled: false,
    });
  };

  const requestSmsAccessForResearch = async () => {
    const status = await requestNativeSmsPermission();
    setSmsAccessStatus(status);
    setNativeCaptureStatus((current) => current ? { ...current, smsAccess: status, smsInboxAccess: status } : current);

    if (status !== 'granted') {
      Alert.alert(
        'SMS permission needed',
        'MoneyKai cannot validate incoming SMS or import recent SMS transactions until Android SMS permission is granted for this research build.'
      );
      return false;
    }

    return true;
  };

  const enableSmsResearchMode = async () => {
    const smsReceiveAccess = nativeCaptureStatus?.smsAccess ?? captureSettings.smsAccessStatus ?? 'unknown';
    const smsInboxAccess = nativeCaptureStatus?.smsInboxAccess ?? captureSettings.smsAccessStatus ?? 'unknown';
    const hasSmsAccess =
      (smsReceiveAccess === 'granted' && smsInboxAccess === 'granted') ||
      await requestSmsAccessForResearch();

    if (!hasSmsAccess) {
      setSmsResearchModeEnabled(false);
      disableNativeSmsCapture();
      return;
    }

    if (!captureSettings.autoCaptureEnabled) {
      setAutoCaptureEnabled(true);
    }
    setSmsResearchModeEnabled(true);
    void setNativeCaptureSourcesEnabled({
      notificationEnabled: captureSettings.notificationCaptureEnabled,
      smsEnabled: true,
    });
  };

  const handleSmsResearchToggle = (enabled: boolean) => {
    if (!enabled) {
      setSmsResearchModeEnabled(false);
      disableNativeSmsCapture();
      return;
    }

    if (!smsResearchBuildEnabled) {
      Alert.alert('Research build required', 'SMS Research Mode is not available in preview or production controls.');
      return;
    }

    if (!captureSettings.smsResearchExplainerAcceptedAt) {
      setShowSmsResearchExplainer(true);
      return;
    }

    void enableSmsResearchMode();
  };

  const handleAcceptSmsResearchExplainer = () => {
    acceptSmsResearchExplainer();
    setShowSmsResearchExplainer(false);
    void enableSmsResearchMode();
  };

  const handleClearSmsResearchData = () => {
    Alert.alert(
      'Clear SMS research data?',
      'This removes pending and ignored SMS research drafts and signals. Notification drafts and confirmed transactions stay in place.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear SMS data',
          style: 'destructive',
          onPress: clearSmsResearchData,
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear cache?',
      'This clears temporary capture queues and cached Android capture status. Your transactions and budgets stay in place.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            void clearNativeCaptureQueue();
            void refreshNativeCaptureStatus(false);
            Alert.alert('Cache cleared', 'Temporary capture cache has been cleared.');
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
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: Spacing['2xl'] }} showsVerticalScrollIndicator={false}>
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
          <SettingItem
            icon="bell-badge-outline"
            iconColor="#444444"
            iconBg="#ECECEC"
            title="Bank Notifications"
            subtitle={`${sourceStatusLabel[notificationSourceStatus]} | Optional transaction notification source`}
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
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Transaction Capture</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <View
            style={{
              paddingBottom: Spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderLight,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
              Transaction Capture creates reviewable drafts from supported transaction signals. Draft review alerts stay on so captured items are never missed.
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
            icon="message-processing-outline"
            iconColor={smsResearchBuildEnabled ? colors.primary : '#5A5A5A'}
            iconBg={smsResearchBuildEnabled ? colors.primaryBg : '#EFEFEF'}
            title="SMS Research Mode"
            subtitle={
              smsResearchBuildEnabled
                ? `${sourceStatusLabel[smsSourceStatus]} | Research-only real SMS validation`
                : `${sourceStatusLabel[smsSourceStatus]} | Not available in production controls`
            }
            right={
              <Switch
                value={captureSettings.smsResearchModeEnabled}
                onValueChange={handleSmsResearchToggle}
                disabled={!smsResearchBuildEnabled}
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
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Maintenance</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem
            icon="cached"
            iconColor="#5A5A5A"
            iconBg="#EFEFEF"
            title="Clear Cache"
            subtitle="Clear temporary capture queues"
            onPress={handleClearCache}
          />
          <SettingItem
            icon="trash-can-outline"
            iconColor={colors.emergency}
            iconBg={colors.emergencyBg}
            title="Clear Capture History"
            subtitle={`${captureInboxCount} pending or ignored items`}
            onPress={handleClearCaptureHistory}
          />
          {smsResearchBuildEnabled ? (
            <SettingItem
              icon="delete-clock-outline"
              iconColor="#5A5A5A"
              iconBg="#EFEFEF"
              title="Clear SMS Research Data"
              subtitle="Remove pending and ignored SMS research drafts"
              onPress={handleClearSmsResearchData}
            />
          ) : null}
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
            'Use the Transaction Capture toggle to turn capture off, or use Maintenance to clear pending capture history.',
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
            Cloud backups store your current transactions, notes, groups, challenges, badges, budget, and settings in Firebase so you can restore them on another device. Capture inbox data, raw notifications, and raw SMS bodies are excluded by default.
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
        visible={showSmsResearchExplainer}
        title="SMS Research Mode"
        subtitle="Experimental internal research. Use only if you understand the privacy and policy limits."
        onClose={() => setShowSmsResearchExplainer(false)}
        footer={
          <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
            <Button
              title="Enable Research Mode"
              icon="shield-check-outline"
              onPress={handleAcceptSmsResearchExplainer}
            />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Button
                title="Not Now"
                onPress={() => setShowSmsResearchExplainer(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title="Privacy"
                onPress={() => {
                  setShowSmsResearchExplainer(false);
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
            'SMS access is experimental and disabled by default.',
            'Production and preview builds do not expose SMS capture controls or request SMS permissions.',
            'Android will ask for SMS permission before real incoming SMS delivery can be validated.',
            'SMS drafts are review-only and never become transactions until you confirm them.',
            'MoneyKai stores sanitized parsed fields, not raw SMS bodies, and cloud backups exclude capture inbox data by default.',
            'Use the SMS Research Mode toggle to turn SMS research off, or use Maintenance to clear SMS research data.',
          ].map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
                {item}
              </Text>
            </View>
          ))}
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



