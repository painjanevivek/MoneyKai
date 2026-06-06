import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationType = 'budget' | 'transaction' | 'challenge' | 'backup' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  icon: string;
  iconColor: string;
  iconBg: string;
  createdAt: string;
  read: boolean;
  actionRoute?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  appendNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & Partial<Pick<AppNotification, 'id' | 'createdAt' | 'read'>>) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  replaceNotifications: (notifications: AppNotification[]) => void;
}

const buildId = () => `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

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
          };

          const nextNotifications = [item, ...state.notifications].slice(0, 100);
          return {
            notifications: nextNotifications,
            unreadCount: nextNotifications.filter((n) => !n.read).length,
          };
        }),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
          unreadCount: 0,
        })),

      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

      replaceNotifications: (notifications) =>
        set({
          notifications,
          unreadCount: notifications.filter((notification) => !notification.read).length,
        }),
    }),
    {
      name: 'smartpaisa-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

