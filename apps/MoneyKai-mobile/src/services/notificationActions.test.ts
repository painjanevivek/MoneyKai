import { beforeEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ data: null as string | null, initial: vi.fn() }));
vi.mock('@notifee/react-native', () => ({ default: { getInitialNotification: mock.initial }, EventType: { PRESS: 1, ACTION_PRESS: 2 } }));
vi.mock('./privateDeviceStorage', () => ({ privateDeviceStorage: { getItem: async () => mock.data, setItem: async (_: string, value: string) => { mock.data = value; }, removeItem: async () => { mock.data = null; } } }));
import { clearShadeActionQueue, handleShadeEvent, parseShadeAction, queueShadeAction, readInitialShadeAction, takeShadeAction } from './notificationActions';
const detail = (id = 'allow-all', ownerId = 'owner', token = 'one') => ({ notification: { data: { kind: 'review', ownerId, token, draftIds: JSON.stringify(['a', 'b']) } }, pressAction: { id } });
describe('encrypted notification action dispatch', () => {
  beforeEach(async () => { await clearShadeActionQueue(); vi.restoreAllMocks(); });
  it('queues but never executes a background financial action, and handles duplicates once', async () => {
    await handleShadeEvent({ type: 2, detail: detail() });
    expect((await takeShadeAction('owner'))?.action).toBe('allow');
    await queueShadeAction(detail()); expect(await takeShadeAction('owner')).toBeUndefined();
  });
  it('discards wrong-owner and expired actions without returning them', async () => {
    await queueShadeAction(detail()); expect(await takeShadeAction('foreign')).toBeUndefined();
    await queueShadeAction(detail('review', 'owner', 'two'));
    const real = Date.now(); vi.spyOn(Date, 'now').mockReturnValue(real + 25 * 60 * 60 * 1000);
    expect(await takeShadeAction('owner')).toBeUndefined();
  });
  it('recognizes all three review actions and transaction taps, rejects malformed payloads', () => {
    expect(parseShadeAction(detail('reject-all'))?.action).toBe('reject'); expect(parseShadeAction(detail('review'))?.action).toBe('review');
    expect(parseShadeAction({ notification: { data: { kind: 'transaction', ownerId: 'owner', token: 'added' } }, pressAction: { id: 'default' } })?.action).toBe('transactions');
    expect(parseShadeAction({ notification: { data: { ...detail().notification.data, draftIds: '[1]' } }, pressAction: { id: 'allow-all' } })).toBeUndefined();
    expect(parseShadeAction(detail('unknown'))).toBeUndefined();
  });
  it('consumes a cold-start launch response through the same secure queue', async () => {
    mock.initial.mockResolvedValue(detail('review')); await readInitialShadeAction();
    expect((await takeShadeAction('owner'))?.ids).toEqual(['a', 'b']);
  });
  it('leaves an action queued while the app is locked or navigation is unavailable', async () => {
    await queueShadeAction(detail()); expect(await takeShadeAction('owner', () => false)).toBeUndefined();
    expect((await takeShadeAction('owner', () => true))?.action).toBe('allow');
  });
});
