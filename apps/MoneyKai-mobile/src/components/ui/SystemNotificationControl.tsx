import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform, StyleSheet, Switch, View } from 'react-native';
import notifee from '@notifee/react-native';
import { AppText as Text } from './AppText';
import { Button } from './Button';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants/theme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { ensureNotificationPermission, setNotificationEnabled } from '@/services/notificationService';

export function SystemNotificationControl() {
  const { colors } = useTheme();
  const enabled = useSettingsStore(state => state.notificationsEnabled);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [settingsRequired, setSettingsRequired] = useState(false);
  const alive = useRef(false);
  const changing = useRef(false);

  useEffect(() => {
    alive.current = true;
    let readVersion = 0;
    const refresh = async () => {
      const version = ++readVersion;
      try {
        const granted = await ensureNotificationPermission(false);
        if (alive.current && version === readVersion) setPermission(granted);
      } catch {
        if (alive.current && version === readVersion) setPermission(false);
      }
    };
    void refresh();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
    });
    return () => { alive.current = false; subscription.remove(); };
  }, []);

  const change = async (next: boolean) => {
    if (changing.current) return;
    changing.current = true;
    setBusy(true);
    try {
      const granted = await setNotificationEnabled(next);
      if (alive.current && next) {
        setPermission(granted);
        setSettingsRequired(!granted);
      }
    } catch {
      if (alive.current) Alert.alert('Notifications unavailable', 'Please try again or check MoneyKai’s notification permission in Android settings.');
    } finally {
      changing.current = false;
      if (alive.current) setBusy(false);
    }
  };

  const openSettings = async () => {
    try { await notifee.openNotificationSettings(); }
    catch { Alert.alert('Could not open settings', 'Open Android Settings → Apps → MoneyKai → Notifications.'); }
  };
  const effective = enabled && permission === true;
  const systemName = Platform.OS === 'android' ? 'Android' : 'device';
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Allow notifications</Text>
        <Switch
          accessibilityLabel="Allow MoneyKai notifications"
          value={effective}
          disabled={busy || permission === null}
          onValueChange={next => void change(next)}
          trackColor={{ false: colors.border, true: colors.primaryBg }}
          thumbColor={effective ? colors.primary : colors.textTertiary}
        />
      </View>
      <Text style={[styles.status, { color: colors.textSecondary }]} accessibilityLiveRegion="polite">
        {permission === null ? 'Checking notification permission…' : effective ? 'Transaction confirmations and pending-review alerts are on.' : permission ? 'MoneyKai notifications are off.' : `${systemName} notification permission is required.`}
      </Text>
      {permission === false ? <Button
        title={settingsRequired ? `Open ${systemName} settings` : `Enable ${systemName} notifications`}
        onPress={() => { if (settingsRequired) void openSettings(); else void change(true); }}
        loading={busy}
        icon="bell-outline"
        variant="secondary"
      /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm, marginBottom: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  label: { flex: 1, fontSize: Typography.fontSize.base },
  status: { fontSize: Typography.fontSize.sm },
});
