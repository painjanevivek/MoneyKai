import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNotificationStore, type NotificationType } from '@/stores/useNotificationStore';

const ICON_STYLES: Record<NotificationType, { icon: string; iconColor: string; iconBg: string }> = {
  budget: { icon: 'wallet-outline', iconColor: '#0D8C4C', iconBg: '#E8F5EE' },
  transaction: { icon: 'cash-plus', iconColor: '#3B82F6', iconBg: '#EBF4FF' },
  challenge: { icon: 'trophy-outline', iconColor: '#8B5CF6', iconBg: '#F3EFFE' },
  backup: { icon: 'cloud-check-outline', iconColor: '#14B8A6', iconBg: '#E8FAF6' },
  system: { icon: 'bell-outline', iconColor: '#6B7280', iconBg: '#F3F4F6' },
};

let listenersInstalled = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const initializeNotificationChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('smartpaisa-default', {
    name: 'SmartPaisa Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#0D8C4C',
  });
};

export const ensureNotificationPermission = async () => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
};

export const setNotificationEnabled = async (enabled: boolean) => {
  if (!enabled) {
    useSettingsStore.getState().setNotificationsEnabled(false);
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
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
}) => {
  const type = params.type ?? 'system';
  const style = ICON_STYLES[type];
  const createdAt = new Date().toISOString();

  useNotificationStore.getState().appendNotification({
    title: params.title,
    body: params.body,
    type,
    icon: style.icon,
    iconColor: style.iconColor,
    iconBg: style.iconBg,
    createdAt,
    read: params.read ?? false,
    actionRoute: params.actionRoute,
  });

  const enabled = useSettingsStore.getState().notificationsEnabled;
  if (!enabled || Platform.OS === 'web' || params.schedule === false) {
    return;
  }

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  await initializeNotificationChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: params.title,
      body: params.body,
      data: { actionRoute: params.actionRoute ?? '/(tabs)/notifications' },
      sound: false,
    },
    trigger: null,
  });
};

export const installNotificationListeners = (onResponse?: (route?: string) => void) => {
  if (listenersInstalled) {
    return () => undefined;
  }

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const route = (response.notification.request.content.data?.actionRoute as string | undefined) ?? '/(tabs)/notifications';
    onResponse?.(route);
  });

  listenersInstalled = true;
  return () => {
    responseSubscription.remove();
    listenersInstalled = false;
  };
};
