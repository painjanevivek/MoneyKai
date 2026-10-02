import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { privateDeviceStorage } from '@/services/privateDeviceStorage';
import type { AppNotification } from '@/types/notification';
export type { AppNotification } from '@/types/notification';
export type { NotificationType } from '@/types/notification';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  accountSeenNotificationIds: string[];
  appendNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & Partial<Pick<AppNotification, 'id' | 'createdAt' | 'read'>>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  markAccountBadgeSeen: () => void;
  clearNotifications: () => void;
  replaceNotifications: (notifications: AppNotification[]) => void;
}

const buildId = () => `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const selectAccountBadgeCount = (state: NotificationState): number =>
  state.notifications.filter((notification) =>
    !notification.read && !(state.accountSeenNotificationIds ?? []).includes(notification.id)
  ).length;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      accountSeenNotificationIds: [],

      appendNotification: (notification) =>
        set((state) => {
          const item: AppNotification = {
            id: notification.id ?? buildId(),
            title: notification.title,
            body: notification.body,
            type: notification.type,
            icon: notification.icon,
            iconColor: notification.iconColor,
            iconBg: notification.iconBg,
            createdAt: notification.createdAt ?? new Date().toISOString(),
            read: notification.read ?? false,
            actionRoute: notification.actionRoute,
            localOnly: notification.localOnly,
          };

          const nextNotifications = [item, ...state.notifications].slice(0, 100);
          return {
            notifications: nextNotifications,
            unreadCount: nextNotifications.filter((n) => !n.read).length,
            accountSeenNotificationIds: state.accountSeenNotificationIds?.filter((id) => nextNotifications.some((item) => item.id === id)) ?? [],
          };
        }),

      markRead: (id) =>
        set((state) => {
          const notifications = state.notifications.map((notification) => notification.id === id ? { ...notification, read: true } : notification);
          return { notifications, unreadCount: notifications.filter((notification) => !notification.read).length };
        }),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
          unreadCount: 0,
        })),

      markAccountBadgeSeen: () =>
        set((state) => ({
          accountSeenNotificationIds: state.notifications.filter((notification) => !notification.read).map((notification) => notification.id),
        })),

      clearNotifications: () => set({ notifications: [], unreadCount: 0, accountSeenNotificationIds: [] }),

      replaceNotifications: (notifications) =>
        set({
          notifications,
          unreadCount: notifications.filter((notification) => !notification.read).length,
        }),
    }),
    {
      name: 'moneykai-notifications',
      storage: createJSONStorage(() => privateDeviceStorage),
    }
  )
);


