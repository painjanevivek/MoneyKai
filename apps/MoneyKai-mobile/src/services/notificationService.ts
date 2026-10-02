import { AppState, Platform } from 'react-native';
import notifee, { AndroidDefaults, AndroidImportance, AndroidVisibility, AuthorizationStatus, EventType } from '@notifee/react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNotificationStore, type NotificationType } from '@/stores/useNotificationStore';
import { vibrateForImportantEvent } from './hapticsService';
import { backendApi, isBackendConfigured } from './backendApi';
import { runPermissionFlow } from './permissionFlow';

const ICON_STYLES: Record<NotificationType, { icon: string; iconColor: string; iconBg: string }> = {
  budget: { icon: 'wallet-outline', iconColor: '#111111', iconBg: '#F4F4F4' },
  transaction: { icon: 'cash-plus', iconColor: '#2B2B2B', iconBg: '#F2F2F2' },
  challenge: { icon: 'trophy-outline', iconColor: '#444444', iconBg: '#ECECEC' },
  backup: { icon: 'cloud-check-outline', iconColor: '#5A5A5A', iconBg: '#E8E8E8' },
  system: { icon: 'bell-outline', iconColor: '#6B7280', iconBg: '#F3F3F3' },
};

let listenersInstalled = false;
let pendingBackendWrites = 0;
const VIBRATING_CHANNEL_ID = 'moneykai-alerts-vibrating';
const QUIET_CHANNEL_ID = 'moneykai-alerts-quiet';
const VIBRATION_PATTERN = [200, 100, 200, 100];

export const initializeNotificationChannel = async (hapticsEnabled = useSettingsStore.getState().hapticEnabled) => {
  if (Platform.OS !== 'android') return undefined;
  const channelId = hapticsEnabled ? VIBRATING_CHANNEL_ID : QUIET_CHANNEL_ID;
  await notifee.createChannel({
    id: channelId,
    name: hapticsEnabled ? 'MoneyKai alerts with vibration' : 'MoneyKai alerts without vibration',
    importance: AndroidImportance.HIGH,
    vibration: hapticsEnabled,
    ...(hapticsEnabled ? { vibrationPattern: VIBRATION_PATTERN } : {}),
    lights: true,
    lightColor: '#111111',
  });
  return channelId;
};

export const ensureNotificationPermission = async (requestIfMissing = true) => {
  // Notification delivery is not a user request to enable access. Never prompt here.
  if (!requestIfMissing) {
    const current = await notifee.getNotificationSettings();
    return current.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      current.authorizationStatus === AuthorizationStatus.PROVISIONAL;
  }
  return runPermissionFlow('notifications', async () => {
  const current = await notifee.getNotificationSettings();
  if (
    current.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    current.authorizationStatus === AuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const result = await notifee.requestPermission();
  return (
    result.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    result.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
  });
};

export const setNotificationEnabled = async (enabled: boolean) => {
  if (!enabled) {
    useSettingsStore.getState().setNotificationsEnabled(false);
    await notifee.cancelAllNotifications().catch(() => undefined);
    return false;
  }

  const granted = await ensureNotificationPermission();
  useSettingsStore.getState().setNotificationsEnabled(granted);
  return granted;
};

export const recordAppNotification = async (params: {
  title: string;
  body: string;
  type?: NotificationType;
  actionRoute?: string;
  schedule?: boolean;
  read?: boolean;
  localOnly?: boolean;
  systemOnly?: boolean;
  ownerId?: string;
  notificationId?: string;
}) => {
  if (params.ownerId && useAuthStore.getState().user?.id !== params.ownerId) return;
  const type = params.type ?? 'system';
  const style = ICON_STYLES[type];
  const createdAt = new Date().toISOString();
  const notification = {
    title: params.title,
    body: params.body,
    type,
    icon: style.icon,
    iconColor: style.iconColor,
    iconBg: style.iconBg,
    createdAt,
    read: params.read ?? false,
    actionRoute: params.actionRoute,
    localOnly: params.localOnly ?? false,
  };

  if (!params.systemOnly) useNotificationStore.getState().appendNotification(notification);

  // Foreground delivery is handled here; the OS channel handles background delivery.
  if (!params.systemOnly && !notification.read && useSettingsStore.getState().notificationsEnabled) {
    vibrateForImportantEvent();
  }

  if (!params.systemOnly && isBackendConfigured() && !params.localOnly) {
    pendingBackendWrites += 1;
    void backendApi
      .createResource('notifications', notification)
      .catch(() => undefined)
      .finally(() => {
        pendingBackendWrites = Math.max(0, pendingBackendWrites - 1);
      });
  }

  const { notificationsEnabled: enabled } = useSettingsStore.getState();
  if (!enabled || params.schedule === false) {
    return;
  }

  const granted = await ensureNotificationPermission(false);
  if (!granted) return;

  if (!useSettingsStore.getState().notificationsEnabled) return;
  if (params.ownerId && useAuthStore.getState().user?.id !== params.ownerId) return;
  const systemVibration = useSettingsStore.getState().hapticEnabled && (params.systemOnly || AppState.currentState !== 'active');
  const channelId = await initializeNotificationChannel(systemVibration);
  if (!useSettingsStore.getState().notificationsEnabled || params.ownerId && useAuthStore.getState().user?.id !== params.ownerId) return;
  await notifee.displayNotification({
    id: params.notificationId,
    title: params.title,
    body: params.body,
    data: { actionRoute: params.actionRoute ?? 'Notifications', ...(params.ownerId ? { ownerId: params.ownerId, token: params.notificationId ?? createdAt, kind: 'transaction' } : {}) },
    android: {
      channelId,
      smallIcon: 'ic_moneykai_notification',
      visibility: AndroidVisibility.PRIVATE,
      defaults: systemVibration ? [AndroidDefaults.VIBRATE] : [],
      ...(systemVibration ? { vibrationPattern: VIBRATION_PATTERN } : {}),
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
    },
    // iOS delivers vibration through the system alert sound, subject to device settings.
    ios: systemVibration ? { sound: 'default' } : {},
  });
};

export const installNotificationListeners = (onResponse?: (route?: string) => void) => {
  if (listenersInstalled) {
    return () => undefined;
  }

  const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
    if (type !== EventType.PRESS) {
      return;
    }

    const route = detail.notification?.data?.actionRoute as string | undefined;
    onResponse?.(route);
  });

  listenersInstalled = true;
  return () => {
    unsubscribe();
    listenersInstalled = false;
  };
};

