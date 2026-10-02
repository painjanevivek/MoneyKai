import { describe, expect, it, vi } from 'vitest';
vi.mock('react-native', () => ({ NativeModules: {} }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: {} }));
import { createPrivateDeviceStorage } from './privateDeviceStorage';

function setup() {
  const values = new Map<string, string>();
  const native = { getPrivateItem: vi.fn(async (key: string) => values.get(key) ?? null),
    setPrivateItem: vi.fn(async (key: string, value: string) => { values.set(key, value); }),
    removePrivateItem: vi.fn(async (key: string) => { values.delete(key); }) };
  const legacy = { getItem: vi.fn(async () => 'legacy'), setItem: vi.fn(), removeItem: vi.fn(async () => undefined) };
  return { native, legacy, storage: createPrivateDeviceStorage(() => native, legacy) };
}
describe('private device storage', () => {
  it('encrypts before removing legacy plaintext and returns decrypted state', async () => {
    const { native, legacy, storage } = setup();
    expect(await storage.getItem('moneykai-auto-capture')).toBe('legacy');
    expect(native.setPrivateItem).toHaveBeenCalledWith('moneykai-auto-capture', 'legacy');
    expect(native.setPrivateItem.mock.invocationCallOrder[0]).toBeLessThan(legacy.removeItem.mock.invocationCallOrder[0]);
    expect(legacy.setItem).not.toHaveBeenCalled();
  });
  it('does not overwrite concurrent edits with migrated state', async () => {
    const { native, storage } = setup();
    await Promise.all([storage.getItem('moneykai-transactions'), storage.setItem('moneykai-transactions', 'new')]);
    expect(await native.getPrivateItem('moneykai-transactions')).toBe('new');
  });
  it('preserves legacy data on encryption failure, never writing plaintext', async () => {
    const { native, legacy, storage } = setup();
    native.setPrivateItem.mockRejectedValueOnce(new Error('key unavailable'));
    await expect(storage.getItem('moneykai-transactions')).rejects.toThrow('key unavailable');
    expect(legacy.removeItem).not.toHaveBeenCalled();
    expect(legacy.setItem).not.toHaveBeenCalled();
  });
  it('fails closed when the native store is missing', async () => {
    const { legacy } = setup();
    const storage = createPrivateDeviceStorage(() => undefined, legacy);
    await expect(storage.setItem('moneykai-transactions', 'secret')).rejects.toThrow('No plaintext fallback');
    expect(legacy.setItem).not.toHaveBeenCalled();
  });
  it('does not silently treat authentication failure as an empty store', async () => {
    const { native, legacy, storage } = setup();
    native.getPrivateItem.mockRejectedValueOnce(new Error('authentication failed'));
    await expect(storage.getItem('moneykai-transactions')).rejects.toThrow('authentication failed');
    expect(legacy.getItem).not.toHaveBeenCalled();
    await expect(storage.setItem('moneykai-transactions', 'empty default state')).rejects.toThrow('ciphertext was preserved');
    expect(native.setPrivateItem).not.toHaveBeenCalled();
  });
});
