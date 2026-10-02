import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ owner: 'owner', enabled: true, permission: true, display: vi.fn(), cancel: vi.fn() }));
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('@notifee/react-native', () => ({ default: { displayNotification: mock.display, cancelNotification: mock.cancel }, AndroidVisibility: { PRIVATE: 0 } }));
vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: { getState: () => ({ user: { id: mock.owner } }) } }));
vi.mock('@/stores/useSettingsStore', () => ({ useSettingsStore: { getState: () => ({ notificationsEnabled: mock.enabled, hapticEnabled: true }) } }));
vi.mock('./notificationService', () => ({ ensureNotificationPermission: async () => mock.permission, initializeNotificationChannel: async () => 'channel' }));
import { displayReviewNotification } from './reviewNotification';
describe('Android pending review summary', () => {
  beforeEach(() => { vi.clearAllMocks(); mock.owner = 'owner'; mock.enabled = true; mock.permission = true; });
  it('posts a count with three launch actions and a frozen draft-ID snapshot', async () => {
    await displayReviewNotification('owner', ['a', 'b'], true);
    const notification = mock.display.mock.calls[0][0];
    expect(notification.android.smallIcon).toBe('ic_moneykai_notification');
    expect(notification.title).toBe('2 transactions need review');
    expect(notification.android.actions.map((item: any) => item.title)).toEqual(['Allow all', 'Reject all', 'Review']);
    expect(notification.android.actions.every((item: any) => item.pressAction.launchActivity === 'default')).toBe(true);
    expect(JSON.parse(notification.data.draftIds)).toEqual(['a', 'b']); expect(notification.android.onlyAlertOnce).toBe(false);
  });
  it('clears a resolved summary and never sends an unauthorized or disabled notice', async () => {
    await displayReviewNotification('owner', []); expect(mock.cancel).toHaveBeenCalledWith('moneykai-pending-review');
    mock.permission = false; await displayReviewNotification('owner', ['a']);
    mock.permission = true; mock.owner = 'other'; await displayReviewNotification('owner', ['a']);
    mock.owner = 'owner'; mock.enabled = false; await displayReviewNotification('owner', ['a']); expect(mock.display).not.toHaveBeenCalled();
  });
});
