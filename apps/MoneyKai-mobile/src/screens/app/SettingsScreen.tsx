import React, { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { isFirebaseConfigured } from '@/firebase/firebaseConfig';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import { createAppScreenStyles } from './screenStyles';

export function SettingsScreen() {
  const { colors, theme } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const appLockEnabled = useSettingsStore((state) => state.appLockEnabled);
  const toggleTheme = useSettingsStore((state) => state.toggleTheme);
  const toggleNotifications = useSettingsStore((state) => state.toggleNotifications);
  const toggleHaptic = useSettingsStore((state) => state.toggleHaptic);
  const setAppLockEnabled = useSettingsStore((state) => state.setAppLockEnabled);
  const [backupLoading, setBackupLoading] = useState(false);

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

  const confirmLogout = () => {
    Alert.alert('Log out?', 'This clears local session state on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Settings</Text>
          <Text style={styles.title}>Profile and sync</Text>
          <Text style={styles.subtitle}>Manage the account, local preferences, and cloud backup state.</Text>
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
            <Text style={styles.muted}>Firebase native config</Text>
            <Text style={{ ...styles.value, color: isFirebaseConfigured() ? colors.primary : colors.error }}>
              {isFirebaseConfigured() ? 'Ready' : 'Missing'}
            </Text>
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={[styles.row, { marginBottom: Spacing.md }]}>
            <Text style={styles.muted}>Dark mode</Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primaryBg }}
              thumbColor={theme === 'dark' ? colors.primary : colors.textTertiary}
            />
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
          <View style={[styles.row, { marginBottom: Spacing.md }]}>
            <Text style={styles.muted}>Haptics</Text>
            <Switch
              value={hapticEnabled}
              onValueChange={toggleHaptic}
              trackColor={{ false: colors.border, true: colors.primaryBg }}
              thumbColor={hapticEnabled ? colors.primary : colors.textTertiary}
            />
          </View>
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
          <Text style={styles.sectionTitle}>Cloud</Text>
          <Text style={{ ...styles.muted, marginBottom: Spacing.md }}>
            Backups and Firestore sync are stored under your authenticated user id.
          </Text>
          <Button title="Save Cloud Backup" onPress={runBackup} loading={backupLoading} icon="cloud-upload-outline" />
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
    </SafeAreaView>
  );
}
