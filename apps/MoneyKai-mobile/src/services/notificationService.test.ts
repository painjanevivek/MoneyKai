import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  appState: { currentState: 'active' },
  platform: { OS: 'android' },
  settings: { hapticEnabled: true, notificationsEnabled: true },
  appendNotification: vi.fn(),
  vibrateForImportantEvent: vi.fn(),
  createChannel: vi.fn(async () => 'channel'),
  displayNotification: vi.fn(async () => undefined),
  getNotificationSettings: vi.fn(async () => ({ authorizationStatus: 1 })),
  requestPermission: vi.fn(async () => ({ authorizationStatus: 1 })),
  backend: { configured: false, createResource: vi.fn(async () => undefined) },
}));

vi.mock('react-native', () => ({ AppState: mock.appState, Platform: mock.platform }));
vi.mock('../stores/useSettingsStore', () => ({
  useSettingsStore: { getState: () => mock.settings },
}));
vi.mock('../stores/useAuthStore', () => ({ useAuthStore: { getState: () => ({ user: { id: 'owner' } }) } }));
vi.mock('../stores/useNotificationStore', () => ({
  useNotificationStore: { getState: () => ({ appendNotification: mock.appendNotification }) },
}));
vi.mock('./hapticsService', () => ({ vibrateForImportantEvent: mock.vibrateForImportantEvent }));
vi.mock('./backendApi', () => ({
  isBackendConfigured: () => mock.backend.configured,
  backendApi: { createResource: mock.backend.createResource },
}));
vi.mock('@notifee/react-native', () => ({
  default: {
    createChannel: mock.createChannel,
    displayNotification: mock.displayNotification,
    getNotificationSettings: mock.getNotificationSettings,
    requestPermission: mock.requestPermission,
  },
  AndroidDefaults: { VIBRATE: 'vibrate' },
  AndroidImportance: { HIGH: 4 },
  AndroidVisibility: { PRIVATE: 0 },
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
  EventType: { PRESS: 1 },
}));

import { ensureNotificationPermission, recordAppNotification } from './notificationService';

describe('notification haptics', () => {
  beforeEach(() => {
    mock.appState.currentState = 'active';
    mock.settings.hapticEnabled = true;
    mock.settings.notificationsEnabled = true;
    mock.appendNotification.mockClear();
    mock.vibrateForImportantEvent.mockClear();
    mock.createChannel.mockClear();
    mock.displayNotification.mockClear();
    mock.backend.configured = false;
    mock.backend.createResource.mockClear();
    mock.getNotificationSettings.mockReset().mockResolvedValue({ authorizationStatus: 1 });
    mock.requestPermission.mockReset().mockResolvedValue({ authorizationStatus: 1 });
  });

  it('uses an in-app pulse and a quiet channel in the foreground', async () => {
    await recordAppNotification({ title: 'Budget alert', body: 'Limit reached', type: 'budget' });

    expect(mock.vibrateForImportantEvent).toHaveBeenCalledTimes(1);
    expect(mock.createChannel).toHaveBeenCalledWith(expect.objectContaining({
      id: 'moneykai-alerts-quiet', vibration: false,
    }));
    expect(mock.displayNotification).toHaveBeenCalledWith(expect.objectContaining({
      android: expect.objectContaining({ channelId: 'moneykai-alerts-quiet', defaults: [], smallIcon: 'ic_moneykai_notification' }),
    }));
  });

  it('uses the vibrating system channel for background delivery', async () => {
    mock.appState.currentState = 'background';
    await recordAppNotification({ title: 'Budget alert', body: 'Limit reached', type: 'budget' });

    expect(mock.createChannel).toHaveBeenCalledWith(expect.objectContaining({
      id: 'moneykai-alerts-vibrating', vibration: true,
    }));
    expect(mock.displayNotification).toHaveBeenCalledWith(expect.objectContaining({
      android: expect.objectContaining({ channelId: 'moneykai-alerts-vibrating', defaults: ['vibrate'], smallIcon: 'ic_moneykai_notification' }),
      ios: { sound: 'default' },
    }));
  });

  it('keeps system notifications quiet when haptics are disabled', async () => {
    mock.appState.currentState = 'background';
    mock.settings.hapticEnabled = false;
    await recordAppNotification({ title: 'Budget alert', body: 'Limit reached', type: 'budget' });

    expect(mock.createChannel).toHaveBeenCalledWith(expect.objectContaining({
      id: 'moneykai-alerts-quiet', vibration: false,
    }));
    expect(mock.displayNotification).toHaveBeenCalledWith(expect.objectContaining({ ios: {} }));
  });

  it('vibrates for foreground inbox-only alerts without posting a system notification', async () => {
    await recordAppNotification({ title: 'Restore complete', body: 'Backup ready', type: 'backup', schedule: false });

    expect(mock.vibrateForImportantEvent).toHaveBeenCalledTimes(1);
    expect(mock.displayNotification).not.toHaveBeenCalled();
  });

  it('does not alert when notifications are disabled', async () => {
    mock.settings.notificationsEnabled = false;
    await recordAppNotification({ title: 'Budget alert', body: 'Limit reached', type: 'budget' });

    expect(mock.appendNotification).toHaveBeenCalledTimes(1);
    expect(mock.vibrateForImportantEvent).not.toHaveBeenCalled();
    expect(mock.displayNotification).not.toHaveBeenCalled();
  });

  it('keeps capture alerts on the phone even when cloud notification sync is available', async () => {
    mock.backend.configured = true;

    await recordAppNotification({ title: 'Transaction draft ready', body: 'Review a captured expense', localOnly: true, schedule: false });
    expect(mock.appendNotification).toHaveBeenCalledTimes(1);
    expect(mock.backend.createResource).not.toHaveBeenCalled();

    await recordAppNotification({ title: 'Budget alert', body: 'Limit reached', schedule: false });
    expect(mock.backend.createResource).toHaveBeenCalledTimes(1);
  });
  it('posts an owned transaction success to Android only, with launch and lock-screen privacy', async () => {
    mock.backend.configured = true;
    await recordAppNotification({ title: 'Transaction added', body: 'Lunch · Debit ₹150.00', ownerId: 'owner', notificationId: 'added-1', actionRoute: 'Transactions', systemOnly: true, localOnly: true });
    expect(mock.appendNotification).not.toHaveBeenCalled(); expect(mock.backend.createResource).not.toHaveBeenCalled();
    expect(mock.displayNotification).toHaveBeenCalledWith(expect.objectContaining({ id: 'added-1', body: 'Lunch · Debit ₹150.00', data: expect.objectContaining({ ownerId: 'owner', kind: 'transaction' }), android: expect.objectContaining({ visibility: 0, pressAction: { id: 'default', launchActivity: 'default' } }) }));
  });
  it('does not post another owner’s transaction', async () => {
    await recordAppNotification({ title: 'Transaction added', body: 'Private', ownerId: 'foreign', systemOnly: true });
    expect(mock.displayNotification).not.toHaveBeenCalled(); expect(mock.appendNotification).not.toHaveBeenCalled();
  });
  it.each([1, 2])('reuses existing notification authorization %s', async (status) => {
    mock.getNotificationSettings.mockResolvedValue({ authorizationStatus: status });
    expect(await ensureNotificationPermission()).toBe(true);
    expect(await ensureNotificationPermission()).toBe(true);
    expect(mock.requestPermission).not.toHaveBeenCalled();
  });
  it('does not prompt during delivery after notification permission is revoked', async () => {
    mock.getNotificationSettings.mockResolvedValue({ authorizationStatus: 0 });
    await recordAppNotification({ title: 'Budget', body: 'Review budget' });
    expect(mock.requestPermission).not.toHaveBeenCalled();
    expect(mock.displayNotification).not.toHaveBeenCalled();
  });
  it('requests revoked access only on an explicit enable action', async () => {
    await ensureNotificationPermission();
    mock.getNotificationSettings.mockResolvedValue({ authorizationStatus: 0 });
    expect(await ensureNotificationPermission()).toBe(true);
    expect(mock.requestPermission).toHaveBeenCalledOnce();
  });
  it('deduplicates a notification enable burst', async () => {
    mock.getNotificationSettings.mockResolvedValue({ authorizationStatus: 0 });
    await Promise.all(Array.from({ length: 20 }, () => ensureNotificationPermission()));
    expect(mock.requestPermission).toHaveBeenCalledOnce();
  });
});
