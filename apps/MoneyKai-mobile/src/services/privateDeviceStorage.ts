import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
import type { StateStorage } from 'zustand/middleware';
import { LARGE_SMS_LOCAL_ENABLED } from '@/config/largeSmsFeatures';

type DeviceCipherStore = {
  getPrivateItem: (name: string) => Promise<string | null>;
  setPrivateItem: (name: string, value: string) => Promise<void>;
  removePrivateItem: (name: string) => Promise<void>;
  getLedgerScreenItem?: (name:string) => Promise<string|null>;
};
type LegacyStore = Pick<StateStorage, 'getItem' | 'setItem' | 'removeItem'>;

/** Serialize hydration, migration and writes so migration cannot overwrite edits. */
export function createPrivateDeviceStorage(native: () => DeviceCipherStore | undefined, legacy: LegacyStore): StateStorage {
  const queues = new Map<string, Promise<unknown>>();
  const failedReads = new Set<string>();
  function ordered<T>(name: string, work: (store: DeviceCipherStore) => Promise<T>): Promise<T> {
    const operation = (queues.get(name) ?? Promise.resolve()).catch(() => undefined).then(() => {
      const store = native();
      if (!store) throw new Error('Device encryption is unavailable. No plaintext fallback was used.');
      return work(store);
    });
    // Keep a handled tail; return the original rejection to the caller.
    const tail = operation.then(() => undefined, () => undefined);
    queues.set(name, tail);
    void tail.then(() => { if (queues.get(name) === tail) queues.delete(name); });
    return operation;
  }
  return {
    getItem: name => ordered(name, async store => {
      try {
        const screenOnly=LARGE_SMS_LOCAL_ENABLED && ['moneykai-transactions','moneykai-auto-capture'].includes(name);
        if(screenOnly && !store.getLedgerScreenItem) throw new Error('Encrypted ledger migration unavailable');
        const current = await (screenOnly ? store.getLedgerScreenItem!(name) : store.getPrivateItem(name));
        if (current !== null) {
          await legacy.removeItem(name);
          failedReads.delete(name);
          return current;
        }
        const previous = await legacy.getItem(name);
        if (previous != null) {
          await store.setPrivateItem(name, previous);
          // Only remove legacy plaintext after encryption succeeded.
          await legacy.removeItem(name);
        }
        failedReads.delete(name);
        return screenOnly && previous != null ? store.getLedgerScreenItem!(name) : previous ?? null;
      } catch (error) {
        // A store's default empty state must not overwrite unreadable ciphertext.
        failedReads.add(name);
        throw error;
      }
    }),
    setItem: (name, value) => ordered(name, async store => {
      if (failedReads.has(name)) throw new Error('Encrypted state could not be hydrated. Existing ciphertext was preserved.');
      await store.setPrivateItem(name, value);
      await legacy.removeItem(name);
      failedReads.delete(name);
    }),
    removeItem: name => ordered(name, async store => {
      await store.removePrivateItem(name);
      await legacy.removeItem(name);
      failedReads.delete(name);
    }),
  };
}

export const privateDeviceStorage = createPrivateDeviceStorage(
  () => NativeModules.MoneyKaiNativeCapture as DeviceCipherStore | undefined,
  AsyncStorage,
);
