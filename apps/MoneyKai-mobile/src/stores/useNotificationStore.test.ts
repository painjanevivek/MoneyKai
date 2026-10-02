import { beforeEach, describe, expect, it, vi } from 'vitest';
import { selectAccountBadgeCount, useNotificationStore } from './useNotificationStore';
vi.mock('@/services/privateDeviceStorage', () => ({ privateDeviceStorage: { getItem: vi.fn(async () => null), setItem: vi.fn(async () => undefined), removeItem: vi.fn(async () => undefined) } }));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

const addNotification = (id: string) => useNotificationStore.getState().appendNotification({
  id,
  title: 'Group created',
  body: 'Goa weekend',
  type: 'system',
  icon: 'bell-outline',
  iconColor: '#000000',
  iconBg: '#FFFFFF',
});

describe('notification indicators', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      accountSeenNotificationIds: [],
    });
  });

  it('dismisses only the Account dot when Account is opened', () => {
    addNotification('first');
    expect(selectAccountBadgeCount(useNotificationStore.getState())).toBe(1);
    expect(useNotificationStore.getState().unreadCount).toBe(1);

    useNotificationStore.getState().markAccountBadgeSeen();
    expect(selectAccountBadgeCount(useNotificationStore.getState())).toBe(0);
    expect(useNotificationStore.getState().unreadCount).toBe(1);

    addNotification('second');
    expect(selectAccountBadgeCount(useNotificationStore.getState())).toBe(1);
    expect(useNotificationStore.getState().unreadCount).toBe(2);
  });

  it('clears the bell dot when the notification is read', () => {
    addNotification('first');
    useNotificationStore.getState().markRead('first');
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(selectAccountBadgeCount(useNotificationStore.getState())).toBe(0);
    expect(useNotificationStore.getState().notifications[0].read).toBe(true);
  });

  it('clears both indicators when all notifications are marked read', () => {
    addNotification('first');
    addNotification('second');
    useNotificationStore.getState().markAllRead();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(selectAccountBadgeCount(useNotificationStore.getState())).toBe(0);
  });
});
