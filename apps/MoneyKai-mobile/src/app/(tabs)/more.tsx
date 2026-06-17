import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AppState, Platform, ScrollView, Share, Switch, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { FinancialDocumentReviewCard } from '@/components/documents/FinancialDocumentReviewCard';
import { GmailConnectionCard } from '@/components/gmail/GmailConnectionCard';
import { ReconciliationReviewCard } from '@/components/reconciliation/ReconciliationReviewCard';
import { SecurityHardeningCard } from '@/components/security/SecurityHardeningCard';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { isBackendConfigured } from '@/services/backendApi';
import { saveCloudBackup, restoreLatestCloudBackup } from '@/services/backupService';
import { isFirebaseConfigured } from '@/services/firebase';
import {
  clearNativeCaptureQueue,
  getNativeCaptureStatus,
  openNativeCaptureSettings,
  requestNativeSmsPermission,
  setNativeCaptureEnabled,
  setNativeCaptureSourcesEnabled,
  type NativeCaptureStatus,
} from '@/services/nativeCaptureBridge';
import { isNativeSmsResearchBuildEnabled, isSmsResearchBuildEnabled } from '@/config/environment';
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

const sourceStatusLabel: Record<CaptureSourceStatus, string> = {
  enabled: 'Enabled',
  disabled: 'Disabled',
  needs_android_access: 'Needs Android access',
  research_only: 'Research only',
  unsupported: 'Unsupported',
};

const MoreItem: React.FC<SettingItemProps> = ({ icon, iconColor, iconBg, title, subtitle, right, onPress, disabled }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress && !disabled ? 0.65 : 1}
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
      {right || (onPress && !disabled ? <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} /> : null)}
    </TouchableOpacity>
  );
};

const MoreSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
        {title}
      </Text>
      {children}
    </View>
  );
};

export default function MoreScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuthStore();
  const transactions = useTransactionStore((s) => s.transactions);
  const { appLockEnabled, setAppLockEnabled } = useSettingsStore();
  const captureSettings = useCaptureStore((s) => s.settings);
  const pendingCaptureDrafts = useCaptureStore((s) => s.drafts.filter((draft) => draft.status === 'pending').length);
  const captureInboxCount = useCaptureStore((s) =>
    s.signals.filter((signal) => signal.processingStatus !== 'confirmed').length +
    s.drafts.filter((draft) => draft.status !== 'confirmed').length
  );
  const setAutoCaptureEnabled = useCaptureStore((s) => s.setAutoCaptureEnabled);
  const setNotificationCaptureEnabled = useCaptureStore((s) => s.setNotificationCaptureEnabled);
  const setSmsResearchModeEnabled = useCaptureStore((s) => s.setSmsResearchModeEnabled);
  const setAiSmsAssistEnabled = useCaptureStore((s) => s.setAiSmsAssistEnabled);
  const acceptNotificationExplainer = useCaptureStore((s) => s.acceptNotificationExplainer);
  const acceptSmsResearchExplainer = useCaptureStore((s) => s.acceptSmsResearchExplainer);
  const setNotificationAccessStatus = useCaptureStore((s) => s.setNotificationAccessStatus);
  const setSmsAccessStatus = useCaptureStore((s) => s.setSmsAccessStatus);
  const clearCaptureInbox = useCaptureStore((s) => s.clearCaptureInbox);
  const clearSmsResearchData = useCaptureStore((s) => s.clearSmsResearchData);
  const syncStatus = useSyncStore((s) => s.status);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const syncError = useSyncStore((s) => s.error);

  const [showBackupSheet, setShowBackupSheet] = useState(false);
  const [showNotificationExplainer, setShowNotificationExplainer] = useState(false);
  const [showSmsExplainer, setShowSmsExplainer] = useState(false);
  const [showSignOutSheet, setShowSignOutSheet] = useState(false);
  const [nativeCaptureStatus, setNativeCaptureStatus] = useState<NativeCaptureStatus | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [nativeStatusBusy, setNativeStatusBusy] = useState(false);

  const smsResearchBuildEnabled = isSmsResearchBuildEnabled();
  const nativeSmsResearchBuildEnabled = isNativeSmsResearchBuildEnabled();
  const switchTrack = { false: colors.border, true: colors.primary } as const;
  const switchThumb = colors.textInverse;

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
    if (!nativeSmsResearchBuildEnabled) return 'enabled';
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
    nativeSmsResearchBuildEnabled,
    smsResearchBuildEnabled,
  ]);

  const refreshNativeCaptureStatus = useCallback(async (showBusy = true) => {
    if (showBusy) setNativeStatusBusy(true);
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
      if (showBusy) setNativeStatusBusy(false);
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

  const requestSmsAccess = async () => {
    const status = await requestNativeSmsPermission();
    setSmsAccessStatus(status);
    setNativeCaptureStatus((current) => current ? { ...current, smsAccess: status, smsInboxAccess: status } : current);
    if (status !== 'granted') {
      Alert.alert('SMS permission needed', 'MoneyKai cannot validate incoming SMS or import recent SMS transactions until Android SMS permission is granted.');
      return false;
    }
    return true;
  };

  const disableNativeSmsCapture = () => {
    void setNativeCaptureSourcesEnabled({
      notificationEnabled: captureSettings.autoCaptureEnabled && captureSettings.notificationCaptureEnabled,
      smsEnabled: false,
    });
  };

  const enableSmsCapture = async () => {
    if (!nativeSmsResearchBuildEnabled) {
      if (!captureSettings.autoCaptureEnabled) setAutoCaptureEnabled(true);
      setSmsResearchModeEnabled(true);
      disableNativeSmsCapture();
      return;
    }

    const smsReceiveAccess = nativeCaptureStatus?.smsAccess ?? captureSettings.smsAccessStatus ?? 'unknown';
    const smsInboxAccess = nativeCaptureStatus?.smsInboxAccess ?? captureSettings.smsAccessStatus ?? 'unknown';
    const hasSmsAccess =
      (smsReceiveAccess === 'granted' && smsInboxAccess === 'granted') ||
      await requestSmsAccess();

    if (!hasSmsAccess) {
      setSmsResearchModeEnabled(false);
      disableNativeSmsCapture();
      return;
    }

    if (!captureSettings.autoCaptureEnabled) setAutoCaptureEnabled(true);
    setSmsResearchModeEnabled(true);
    void setNativeCaptureSourcesEnabled({
      notificationEnabled: captureSettings.notificationCaptureEnabled,
      smsEnabled: true,
    });
  };

  const handleAutoCaptureToggle = async (enabled: boolean) => {
    if (!enabled) {
      setAutoCaptureEnabled(false);
      void setNativeCaptureEnabled(false);
      void clearNativeCaptureQueue();
      return;
    }

    let smsCaptureEnabledForAlert =
      smsResearchBuildEnabled &&
      nativeSmsResearchBuildEnabled &&
      captureSettings.smsResearchModeEnabled;

    if (smsCaptureEnabledForAlert) {
      const hasSmsAccess = await requestSmsAccess();
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
        ? 'MoneyKai will create reviewable drafts from supported transaction signals. SMS access is requested now because recent SMS import needs explicit Android permission.'
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

  const handleSmsToggle = (enabled: boolean) => {
    if (!enabled) {
      setSmsResearchModeEnabled(false);
      disableNativeSmsCapture();
      return;
    }
    if (!smsResearchBuildEnabled) {
      Alert.alert('SMS Capture unavailable', 'SMS Capture is disabled in this build.');
      return;
    }
    if (!captureSettings.smsResearchExplainerAcceptedAt) {
      setShowSmsExplainer(true);
      return;
    }
    void enableSmsCapture();
  };

  const handleAcceptSmsExplainer = () => {
    acceptSmsResearchExplainer();
    setShowSmsExplainer(false);
    void enableSmsCapture();
  };

  const handleClearCache = () => {
    Alert.alert('Clear cache?', 'This clears temporary capture queues and cached Android capture status. Your transactions and budgets stay in place.', [
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
    ]);
  };

  const handleClearCaptureHistory = () => {
    if (captureInboxCount === 0) {
      Alert.alert('Nothing to clear', 'There are no pending or ignored capture items to remove.');
      return;
    }

    Alert.alert('Clear capture history?', 'This removes pending and ignored capture drafts and signals. Confirmed transactions stay in your transaction history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearCaptureInbox();
          void clearNativeCaptureQueue();
        },
      },
    ]);
  };

  const handleClearSmsData = () => {
    Alert.alert('Clear SMS capture data?', 'This removes pending and ignored SMS drafts and signals. Notification drafts and confirmed transactions stay in place.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear SMS data', style: 'destructive', onPress: clearSmsResearchData },
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
        await Share.share({ title: 'MoneyKai transactions CSV', message: csv });
      }
    } catch (err) {
      Alert.alert('Export Failed', err instanceof Error ? err.message : 'Could not export data.');
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

  const quickActions = [
    { label: 'Savings', icon: 'piggy-bank-outline', route: '/(tabs)/savings' },
    { label: 'Notifications', icon: 'bell-outline', route: '/(tabs)/notifications' },
    { label: 'AI Review', icon: 'receipt-text-outline', route: '/(tabs)/ai-review' },
    { label: 'Accounts', icon: 'bank-outline', route: '/(tabs)/accounts' },
    { label: 'Notes', icon: 'note-text-outline', route: '/(tabs)/notes' },
    { label: 'Groups', icon: 'account-group-outline', route: '/(tabs)/groups' },
    { label: 'Portfolio', icon: 'briefcase-outline', route: '/(tabs)/portfolio' },
    { label: 'Wealth', icon: 'chart-timeline-variant', route: '/(tabs)/wealth' },
    { label: 'Settings', icon: 'cog-outline', route: '/(tabs)/settings' },
    { label: 'Support', icon: 'help-circle-outline', route: '/contact' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing['2xl'] }} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: Spacing.lg }}>
          <Text style={{ fontSize: Typography.fontSize.xl, lineHeight: 28, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
            More
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
            Tools, imports, privacy, and account
          </Text>
        </View>

        <Card style={{ marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <UserAvatar name={user?.full_name} email={user?.email} avatarUrl={user?.avatar_url} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                {user?.full_name || 'Your profile'}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>{user?.email || 'No email available'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile-edit' as any)} accessibilityRole="button" accessibilityLabel="Edit profile">
              <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        <MoreSection title="Money Tools">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.route}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.82}
                style={{
                  flexBasis: '48%',
                  flexGrow: 1,
                  minHeight: 78,
                  padding: Spacing.md,
                  borderRadius: BorderRadius.md,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <MaterialCommunityIcons name={action.icon as any} size={21} color={colors.primary} />
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </MoreSection>

        <MoreSection title="Transaction Capture">
          <Card>
            <View style={{ paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
                Capture creates reviewable drafts from supported transaction signals. Nothing becomes a transaction until you confirm it.
              </Text>
            </View>
            <MoreItem
              icon="radar"
              iconColor="#111111"
              iconBg="#F4F4F4"
              title="Automatic Capture"
              subtitle={captureSettings.autoCaptureEnabled ? `${pendingCaptureDrafts} drafts waiting for review` : 'Create drafts from supported transaction alerts'}
              right={<Switch value={captureSettings.autoCaptureEnabled} onValueChange={handleAutoCaptureToggle} trackColor={switchTrack} thumbColor={switchThumb} ios_backgroundColor={colors.borderLight} />}
            />
            <MoreItem
              icon="bell-badge-outline"
              iconColor="#444444"
              iconBg="#ECECEC"
              title="Bank Notifications"
              subtitle={`${sourceStatusLabel[notificationSourceStatus]} | Optional transaction notification source`}
              right={<Switch value={captureSettings.notificationCaptureEnabled} onValueChange={setNotificationCaptureEnabled} disabled={!captureSettings.autoCaptureEnabled || Platform.OS !== 'android'} trackColor={switchTrack} thumbColor={switchThumb} ios_backgroundColor={colors.borderLight} />}
            />
            {Platform.OS === 'android' ? (
              <MoreItem
                icon="cellphone-cog"
                iconColor="#444444"
                iconBg="#ECECEC"
                title="Android Notification Access"
                subtitle={nativeStatusBusy ? 'Checking access status' : notificationSourceStatus === 'enabled' ? 'Granted for MoneyKai' : 'Required before notification drafts can be created'}
                onPress={handleOpenNativeCaptureSettings}
                disabled={!captureSettings.autoCaptureEnabled}
              />
            ) : null}
            <MoreItem
              icon="message-processing-outline"
              iconColor={smsResearchBuildEnabled ? colors.primary : '#5A5A5A'}
              iconBg={smsResearchBuildEnabled ? colors.primaryBg : '#EFEFEF'}
              title="SMS Capture"
              subtitle={
                smsResearchBuildEnabled
                  ? nativeSmsResearchBuildEnabled
                    ? `${sourceStatusLabel[smsSourceStatus]} | Ask Android for SMS access when enabled`
                    : `${sourceStatusLabel[smsSourceStatus]} | Paste SMS manually, no SMS permission`
                  : `${sourceStatusLabel[smsSourceStatus]} | Disabled in this build`
              }
              right={<Switch value={captureSettings.smsResearchModeEnabled} onValueChange={handleSmsToggle} disabled={!smsResearchBuildEnabled} trackColor={switchTrack} thumbColor={switchThumb} ios_backgroundColor={colors.borderLight} />}
            />
            <MoreItem
              icon="brain"
              iconColor={captureSettings.aiSmsAssistEnabled ? colors.primary : '#5A5A5A'}
              iconBg={captureSettings.aiSmsAssistEnabled ? colors.primaryBg : '#EFEFEF'}
              title="AI SMS Assist"
              subtitle={captureSettings.aiSmsAssistEnabled ? 'Review-required fallback for low-confidence SMS' : 'Off by default, deterministic parser stays primary'}
              right={<Switch value={Boolean(captureSettings.aiSmsAssistEnabled)} onValueChange={setAiSmsAssistEnabled} disabled={!captureSettings.autoCaptureEnabled || !smsResearchBuildEnabled} trackColor={switchTrack} thumbColor={switchThumb} ios_backgroundColor={colors.borderLight} />}
            />
            <MoreItem
              icon="inbox-arrow-down-outline"
              iconColor="#8A8A8A"
              iconBg="#F2F2F2"
              title="Review Captured Drafts"
              subtitle={`${pendingCaptureDrafts} pending`}
              onPress={() => router.push('/(tabs)/notifications' as any)}
            />
          </Card>
        </MoreSection>

        <MoreSection title="Financial Imports">
          <GmailConnectionCard />
          <FinancialDocumentReviewCard />
          <ReconciliationReviewCard />
        </MoreSection>

        <MoreSection title="Data & Privacy">
          <Card>
            <MoreItem
              icon="cloud-sync-outline"
              iconColor="#111111"
              iconBg="#F4F4F4"
              title="Cloud Sync"
              subtitle={syncStatus === 'syncing' ? 'Syncing your data now' : syncStatus === 'failed' ? syncError ?? 'Last sync failed' : lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}` : 'Not synced yet'}
            />
            <MoreItem
              icon="shield-lock-outline"
              iconColor="#111111"
              iconBg="#F4F4F4"
              title="App Lock"
              subtitle={appLockEnabled ? 'Biometric lock enabled' : 'Biometric lock disabled'}
              right={<Switch value={appLockEnabled} onValueChange={setAppLockEnabled} trackColor={switchTrack} thumbColor={switchThumb} ios_backgroundColor={colors.borderLight} />}
            />
            <MoreItem icon="download-outline" iconColor="#111111" iconBg="#F4F4F4" title="Export Data (CSV)" subtitle="Share your transactions as CSV" onPress={handleExport} />
            <MoreItem icon="cloud-upload-outline" iconColor="#2B2B2B" iconBg="#F2F2F2" title="Cloud backups" subtitle="Save to or restore a cloud backup" onPress={() => setShowBackupSheet(true)} />
            <MoreItem icon="shield-lock-outline" iconColor="#444444" iconBg="#ECECEC" title="Privacy Policy" subtitle="Open the privacy policy" onPress={() => router.push('/privacy-policy' as any)} />
            <MoreItem icon="cached" iconColor="#5A5A5A" iconBg="#EFEFEF" title="Clear Cache" subtitle="Clear temporary capture queues" onPress={handleClearCache} />
            <MoreItem icon="trash-can-outline" iconColor={colors.emergency} iconBg={colors.emergencyBg} title="Clear Capture History" subtitle={`${captureInboxCount} pending or ignored items`} onPress={handleClearCaptureHistory} />
            {smsResearchBuildEnabled ? (
              <MoreItem icon="delete-clock-outline" iconColor="#5A5A5A" iconBg="#EFEFEF" title="Clear SMS Capture Data" subtitle="Remove pending and ignored SMS drafts" onPress={handleClearSmsData} />
            ) : null}
          </Card>
        </MoreSection>

        <MoreSection title="Security">
          <SecurityHardeningCard />
        </MoreSection>

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
        visible={showNotificationExplainer}
        title="Android notification access"
        subtitle="MoneyKai needs Android notification access only if you want supported bank and payment alerts turned into reviewable drafts."
        onClose={() => setShowNotificationExplainer(false)}
        footer={
          <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
            <Button title="Open Android Settings" icon="cellphone-cog" onPress={handleAcceptNotificationExplainer} />
            <Button title="Not Now" onPress={() => setShowNotificationExplainer(false)} variant="outline" />
          </View>
        }
      >
        <View style={{ gap: Spacing.md }}>
          {[
            'MoneyKai only uses supported transaction-like alerts to create drafts for your review.',
            'Drafts do not change budgets or transaction history until you confirm them.',
            'Full raw notification payloads are not shown by default.',
          ].map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>{item}</Text>
            </View>
          ))}
        </View>
      </ModalSheet>

      <ModalSheet
        visible={showSmsExplainer}
        title="SMS Capture"
        subtitle={nativeSmsResearchBuildEnabled ? 'MoneyKai can ask Android for SMS access and create reviewable transaction drafts.' : 'Paste transaction SMS manually for review without granting SMS permissions.'}
        onClose={() => setShowSmsExplainer(false)}
        footer={
          <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
            <Button title="Enable SMS Capture" icon="shield-check-outline" onPress={handleAcceptSmsExplainer} />
            <Button title="Not Now" onPress={() => setShowSmsExplainer(false)} variant="outline" />
          </View>
        }
      >
        <View style={{ gap: Spacing.md }}>
          {[
            nativeSmsResearchBuildEnabled ? 'Android will ask for SMS permission before incoming SMS can create drafts.' : 'This build does not request READ_SMS or RECEIVE_SMS permissions.',
            'SMS drafts are review-only and never become transactions until you confirm them.',
            'MoneyKai stores sanitized parsed fields, not raw SMS bodies.',
          ].map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>{item}</Text>
            </View>
          ))}
        </View>
      </ModalSheet>

      <ModalSheet
        visible={showBackupSheet}
        title="Cloud backups"
        subtitle={isBackendConfigured() ? 'Make sure the MoneyKai backend is running and Firestore is available for cloud backups.' : isFirebaseConfigured() ? 'Create Firestore once in Firebase Console before your first cloud backup.' : 'Firebase is required for cloud backups.'}
        onClose={() => setShowBackupSheet(false)}
        footer={
          <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
            <Button title="Back Up Now" onPress={handleCloudBackup} loading={backupBusy} disabled={!isFirebaseConfigured() && !isBackendConfigured()} />
            <Button title="Restore Latest Backup" onPress={handleCloudRestore} variant="outline" loading={backupBusy} disabled={!isFirebaseConfigured() && !isBackendConfigured()} />
          </View>
        }
      >
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
          Cloud backups store your current transactions, linked accounts, notes, groups, challenges, badges, budget, and settings in Firebase. Capture inbox data, raw notifications, and raw SMS bodies are excluded by default.
        </Text>
      </ModalSheet>

      <ModalSheet
        visible={showSignOutSheet}
        title="Sign out"
        subtitle="You will need to sign in again to access your MoneyKai account on this device."
        onClose={() => (signOutBusy ? undefined : setShowSignOutSheet(false))}
        footer={
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
            <Button title="Cancel" onPress={() => setShowSignOutSheet(false)} variant="outline" style={{ flex: 1 }} disabled={signOutBusy} />
            <Button title="Sign Out" onPress={handleSignOut} loading={signOutBusy} style={{ flex: 1 }} />
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
