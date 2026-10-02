import { Platform } from 'react-native';
import notifee, { AndroidVisibility } from '@notifee/react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { ensureNotificationPermission, initializeNotificationChannel } from './notificationService';

export const REVIEW_NOTIFICATION_ID = 'moneykai-pending-review';
export async function displayReviewNotification(ownerId: string, ids: string[], alert = false) {
  if (Platform.OS !== 'android' || !useSettingsStore.getState().notificationsEnabled || useAuthStore.getState().user?.id !== ownerId) return;
  if (!ids.length) { await notifee.cancelNotification(REVIEW_NOTIFICATION_ID); return; }
  if (!await ensureNotificationPermission(false)) return;
  const channelId = await initializeNotificationChannel(useSettingsStore.getState().hapticEnabled);
  if (useAuthStore.getState().user?.id !== ownerId || !useSettingsStore.getState().notificationsEnabled) return;
  await notifee.displayNotification({
    id: REVIEW_NOTIFICATION_ID,
    title: `${ids.length} ${ids.length === 1 ? 'transaction needs' : 'transactions need'} review`,
    body: 'Check the drafts, or choose a batch action below.',
    data: { ownerId, kind: 'review', token: `review-${Date.now()}-${Math.random().toString(36).slice(2)}`, draftIds: JSON.stringify(ids) },
    android: {
      channelId, smallIcon: 'ic_moneykai_notification', visibility: AndroidVisibility.PRIVATE,
      onlyAlertOnce: !alert, autoCancel: false,
      pressAction: { id: 'review', launchActivity: 'default' },
      actions: [
        { title: 'Allow all', pressAction: { id: 'allow-all', launchActivity: 'default' } },
        { title: 'Reject all', pressAction: { id: 'reject-all', launchActivity: 'default' } },
        { title: 'Review', pressAction: { id: 'review', launchActivity: 'default' } },
      ],
    },
  });
}
