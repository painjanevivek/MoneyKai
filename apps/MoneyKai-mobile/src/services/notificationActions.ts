import notifee, { EventType, type EventDetail } from '@notifee/react-native';
import { privateDeviceStorage } from './privateDeviceStorage';

export type ShadeAction = { ownerId: string; token: string; ids: string[]; action: 'allow' | 'reject' | 'review' | 'transactions'; at: number };
const KEY = 'moneykai-private-notification-action';
export const clearShadeActionQueue = () => serial(async () => { await privateDeviceStorage.removeItem(KEY); });
const observers = new Set<() => void>();
let ordered: Promise<unknown> = Promise.resolve();
function serial<T>(work: () => Promise<T>): Promise<T> {
  const result = ordered.catch(() => undefined).then(work);
  ordered = result.catch(() => undefined);
  return result;
}
export function parseShadeAction(detail: EventDetail): ShadeAction | undefined {
  const data = detail.notification?.data;
  if (!data || typeof data.ownerId !== 'string' || typeof data.token !== 'string') return;
  const id = detail.pressAction?.id;
  if (data.kind === 'transaction') return { ownerId: data.ownerId, token: data.token, ids: [], action: 'transactions', at: Date.now() };
  if (data.kind !== 'review' || typeof data.draftIds !== 'string' || data.draftIds.length > 25_000) return;
  const action = id === 'allow-all' ? 'allow' : id === 'reject-all' ? 'reject' : id === 'review' || id === 'default' ? 'review' : undefined;
  if (!action) return;
  try {
    const ids = JSON.parse(data.draftIds) as unknown;
    if (!Array.isArray(ids) || ids.length > 100 || ids.some(value => typeof value !== 'string' || value.length > 160)) return;
    return { ownerId: data.ownerId, token: data.token, ids: [...new Set(ids)], action, at: Date.now() };
  } catch { return; }
}
export async function queueShadeAction(detail: EventDetail) {
  const action = parseShadeAction(detail);
  if (!action) return;
  const queued = await serial(async () => {
    const previous = JSON.parse(await privateDeviceStorage.getItem(KEY) ?? '{}') as { last?: string; pending?: ShadeAction };
    const key = `${action.token}:${action.action}`;
    if (previous.last === key || previous.pending?.token === action.token && previous.pending.action === action.action) return false;
    await privateDeviceStorage.setItem(KEY, JSON.stringify({ last: previous.last, pending: action }));
    return true;
  });
  if (queued) observers.forEach(notify => notify());
}
export const subscribeShadeActions = (notify: () => void) => { observers.add(notify); return () => { observers.delete(notify); }; };
export const takeShadeAction = (ownerId: string, canConsume = () => true) => serial(async () => {
  const previous = JSON.parse(await privateDeviceStorage.getItem(KEY) ?? '{}') as { last?: string; pending?: ShadeAction };
  const action = previous.pending;
  if (!action || !canConsume()) return;
  await privateDeviceStorage.setItem(KEY, JSON.stringify({ last: `${action.token}:${action.action}` }));
  if (action.ownerId !== ownerId || Date.now() - action.at > 24 * 60 * 60 * 1000) return;
  return action;
});
export const handleShadeEvent = async ({ type, detail }: { type: EventType; detail: EventDetail }) => {
  if (type === EventType.PRESS || type === EventType.ACTION_PRESS) await queueShadeAction(detail).catch(() => undefined);
};
export const readInitialShadeAction = async () => {
  const initial = await notifee.getInitialNotification();
  if (initial) await queueShadeAction(initial);
};
