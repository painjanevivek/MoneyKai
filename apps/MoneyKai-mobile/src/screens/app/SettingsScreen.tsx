import React, { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { sendFirebasePasswordResetEmail } from '@/services/authService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSyncStore } from '@/stores/useSyncStore';
import { getFirebaseConfigStatus, isFirebaseConfigured } from '@/firebase/firebaseConfig';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, THEME_OPTIONS, Typography } from '@/constants/theme';
import { createAppScreenStyles } from './screenStyles';

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Not synced yet';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not synced yet';
  }
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export function SettingsScreen() {
  const { colors, darkModeEnabled, setDarkModeEnabled, setThemePalette, themePalette } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const appLockEnabled = useSettingsStore((state) => state.appLockEnabled);
  const toggleNotifications = useSettingsStore((state) => state.toggleNotifications);
  const toggleHaptic = useSettingsStore((state) => state.toggleHaptic);
  const setAppLockEnabled = useSettingsStore((state) => state.setAppLockEnabled);
  const syncStatus = useSyncStore((state) => state.status);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);
  const lastCacheHydratedAt = useSyncStore((state) => state.lastCacheHydratedAt);
  const syncError = useSyncStore((state) => state.error);
  const pendingCount = useSyncStore((state) => state.pendingCount);
  const isOnline = useSyncStore((state) => state.isOnline);
  const [backupLoading, setBackupLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const firebaseReady = isFirebaseConfigured();
  const firebaseConfigStatus = getFirebaseConfigStatus();
  const nativeFirebaseReady = firebaseConfigStatus === 'native-ready';
  const firebaseStatusLabel =
    nativeFirebaseReady
      ? 'Ready'
      : firebaseConfigStatus === 'web-app-id-only'
        ? 'Android app needed'
        : 'Missing';

  const sendPasswordLink = async () => {
    if (!user?.email) {
      Alert.alert('Email unavailable', 'MoneyKai could not find an email address for this account.');
      return;
    }

    if (!firebaseReady) {
      Alert.alert('Password reset unavailable', 'Firebase Authentication is not configured for this build.');
      return;
    }

    setPasswordLoading(true);
    try {
      await sendFirebasePasswordResetEmail(user.email);
      setShowPasswordSheet(false);
      Alert.alert('Reset link sent', `We sent a password reset link to ${user.email}.`);
    } catch (error) {
      Alert.alert('Reset failed', error instanceof Error ? error.message : 'Could not send the reset link.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const runBackup = async () => {
    setBackupLoading(true);
    try {
      const { saveCloudBackup } = await import('@/services/backupService');
      await saveCloudBackup();
      Alert.alert('Backup saved', 'Your account data was backed up.');
    } catch (error) {
      Alert.alert('Backup failed', error instanceof Error ? error.message : 'Could not save a backup.');
    } finally {
      setBackupLoading(false);
    }
  };

  const runSync = async () => {
    setSyncLoading(true);
    try {
      const [{ flushSyncQueue }, { syncRemoteState }] = await Promise.all([
        import('@/services/syncQueue'),
        import('@/services/remoteSync'),
      ]);
      await flushSyncQueue();
      const result = await syncRemoteState({ force: true });
      if (!result.synced) {
        throw new Error(result.error ?? 'Could not sync account data.');
      }
      Alert.alert(
        result.source === 'cache' ? 'Cached data ready' : 'Sync complete',
        result.source === 'cache'
          ? 'MoneyKai is using the latest cached data on this device.'
          : 'MoneyKai is up to date.',
      );
    } catch (error) {
      Alert.alert('Sync failed', error instanceof Error ? error.message : 'Could not sync account data.');
    } finally {
      setSyncLoading(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Log out?', 'This clears local session state on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ScreenBackButton />
          <Text style={styles.title}>Settings and sync</Text>
          <Text style={styles.subtitle}>Manage security, local preferences, and cloud backup state.</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.row}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  alignItems: 'center',
                  backgroundColor: colors.primaryBg,
                  borderRadius: 24,
                  height: 48,
                  justifyContent: 'center',
                  marginRight: Spacing.md,
                  width: 48,
                }}
              >
                <MaterialCommunityIcons name="account-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.value}>{user?.full_name ?? 'MoneyKai user'}</Text>
                <Text style={styles.muted}>{user?.email ?? 'Signed in locally'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.muted}>Firebase config</Text>
            <Text style={{ ...styles.value, color: nativeFirebaseReady ? colors.primary : colors.warning }}>
              {firebaseStatusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Security</Text>
          <Button
            title="Change password"
            onPress={() => setShowPasswordSheet(true)}
            icon="lock-reset"
            variant="secondary"
            style={{ marginBottom: Spacing.sm }}
          />
          <View style={styles.row}>
            <Text style={styles.muted}>App lock</Text>
            <Switch
              value={appLockEnabled}
              onValueChange={setAppLockEnabled}
              trackColor={{ false: colors.border, true: colors.primaryBg }}
              thumbColor={appLockEnabled ? colors.primary : colors.textTertiary}
            />
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={[styles.row, { marginBottom: Spacing.md }]}>
            <Text style={styles.muted}>Dark mode</Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: colors.border, true: colors.primaryBg }}
              thumbColor={darkModeEnabled ? colors.primary : colors.textTertiary}
            />
          </View>
          <View style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
            <Text style={styles.muted}>Theme palette</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {THEME_OPTIONS.map((option) => {
                const active = themePalette === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    activeOpacity={0.82}
                    onPress={() => setThemePalette(option.id)}
                    style={{
                      width: '48%',
                      minWidth: 132,
                      flexGrow: 1,
                      borderRadius: BorderRadius.md,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primaryBg : colors.surface,
                      padding: Spacing.sm,
                    }}
                  >
                    <View style={{ flexDirection: 'row', marginBottom: Spacing.xs }}>
                      {option.swatches.map((swatch) => (
                        <View
                          key={swatch}
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: swatch,
                            borderWidth: 1,
                            borderColor: colors.borderLight,
                            marginRight: -3,
                          }}
                        />
                      ))}
                    </View>
                    <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>
                      {option.label}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: 2 }} numberOfLines={2}>
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={[styles.row, { marginBottom: Spacing.md }]}>
            <Text style={styles.muted}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primaryBg }}
              thumbColor={notificationsEnabled ? colors.primary : colors.textTertiary}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.muted}>Haptics</Text>
            <Switch
              value={hapticEnabled}
              onValueChange={toggleHaptic}
              trackColor={{ false: colors.border, true: colors.primaryBg }}
              thumbColor={hapticEnabled ? colors.primary : colors.textTertiary}
            />
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Cloud</Text>
          <Text style={{ ...styles.muted, marginBottom: Spacing.md }}>
            Backups and Firestore sync are stored under your authenticated user id.
          </Text>
          <View
            style={{
              backgroundColor: isOnline ? colors.surfaceElevated : colors.primaryBg,
              borderColor: syncError ? colors.error : colors.borderLight,
              borderRadius: 12,
              borderWidth: 1,
              marginBottom: Spacing.md,
              padding: Spacing.md,
            }}
          >
            <View style={[styles.row, { alignItems: 'flex-start', marginBottom: Spacing.sm }]}>
              <View style={{ flex: 1, paddingRight: Spacing.md }}>
                <Text style={styles.value}>
                  {!isOnline ? 'Offline mode' : syncStatus === 'syncing' ? 'Syncing' : 'Cloud sync'}
                </Text>
                <Text style={styles.muted}>
                  {pendingCount > 0
                    ? `${pendingCount} change${pendingCount === 1 ? '' : 's'} waiting to upload`
                    : syncError ?? 'Cached reads and retryable writes are active.'}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={!isOnline ? 'cloud-off-outline' : syncStatus === 'syncing' ? 'sync' : 'cloud-check-outline'}
                size={24}
                color={!isOnline ? colors.warning : syncError ? colors.error : colors.primary}
              />
            </View>
            <View style={[styles.row, { marginTop: Spacing.sm }]}>
              <Text style={styles.muted}>Last cloud sync</Text>
              <Text style={{ ...styles.muted, color: colors.textPrimary }}>{formatDateTime(lastSyncedAt)}</Text>
            </View>
            <View style={[styles.row, { marginTop: Spacing.xs }]}>
              <Text style={styles.muted}>Cache hydrated</Text>
              <Text style={{ ...styles.muted, color: colors.textPrimary }}>{formatDateTime(lastCacheHydratedAt)}</Text>
            </View>
          </View>
          <Button
            title="Sync now"
            onPress={runSync}
            loading={syncLoading || syncStatus === 'syncing'}
            icon="sync"
            variant="secondary"
            style={{ marginBottom: Spacing.sm }}
          />
          <Button title="Save cloud backup" onPress={runBackup} loading={backupLoading} icon="cloud-upload-outline" />
        </View>

        <TouchableOpacity
          onPress={confirmLogout}
          style={{
            alignItems: 'center',
            borderColor: colors.border,
            borderRadius: 12,
            borderWidth: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            minHeight: 48,
          }}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
          <Text style={{ ...styles.value, color: colors.error, marginLeft: Spacing.sm }}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <ModalSheet
        visible={showPasswordSheet}
        title="Change password"
        subtitle="MoneyKai will send a secure reset link to your account email."
        onClose={() => (passwordLoading ? undefined : setShowPasswordSheet(false))}
        footer={
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
            <Button
              title="Cancel"
              onPress={() => setShowPasswordSheet(false)}
              variant="outline"
              style={{ flex: 1 }}
              disabled={passwordLoading}
            />
            <Button
              title="Send link"
              onPress={sendPasswordLink}
              loading={passwordLoading}
              style={{ flex: 1 }}
              disabled={!user?.email || !firebaseReady}
            />
          </View>
        }
      >
        <View style={{ gap: Spacing.md }}>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22 }}>
            The reset email will go to {user?.email || 'your account email'}. After you change your password, use the new password the next time you sign in.
          </Text>
          <View style={{ padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: `${colors.primary}22` }}>
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary, marginBottom: 4 }}>
              Secure reset
            </Text>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
              MoneyKai does not ask for or store your current password here. Firebase handles the reset link and verification.
            </Text>
          </View>
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}
