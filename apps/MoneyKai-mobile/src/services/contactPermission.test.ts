import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ check: vi.fn(), request: vi.fn(), os: 'ios', androidCheck: vi.fn(), androidRequest: vi.fn() }));
vi.mock('react-native', () => ({ Platform: { get OS() { return mocks.os; } }, PermissionsAndroid: { check: mocks.androidCheck, request: mocks.androidRequest, PERMISSIONS: { READ_CONTACTS: 'android.permission.READ_CONTACTS' }, RESULTS: { GRANTED: 'granted' } } }));
vi.mock('react-native-contacts', () => ({ default: { checkPermission: mocks.check, requestPermission: mocks.request } }));
import { ensureContactPermission } from './contactPermission';

describe('contacts permission reuse', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.os = 'ios'; mocks.check.mockResolvedValue('authorized'); mocks.request.mockResolvedValue('authorized'); mocks.androidCheck.mockResolvedValue(false); mocks.androidRequest.mockResolvedValue('granted'); });
  it.each(['authorized', 'limited'])('skips requests when access is %s', async (status) => {
    mocks.check.mockResolvedValue(status);
    await ensureContactPermission(); await ensureContactPermission();
    expect(mocks.request).not.toHaveBeenCalled();
    expect(mocks.check).toHaveBeenCalledTimes(2);
  });
  it('requests again on a user action after access was revoked', async () => {
    await ensureContactPermission();
    mocks.check.mockResolvedValue('denied');
    expect(await ensureContactPermission()).toBe('authorized');
    expect(mocks.request).toHaveBeenCalledOnce();
  });
  it('deduplicates rapid permission requests and preserves denial', async () => {
    mocks.check.mockResolvedValue('denied'); mocks.request.mockResolvedValue('denied');
    expect(await Promise.all(Array.from({ length: 20 }, () => ensureContactPermission()))).toEqual(Array(20).fill('denied'));
    expect(mocks.request).toHaveBeenCalledOnce();
  });
  it('uses Android runtime permission before reading, never the contacts module legacy request callback', async () => {
    mocks.os = 'android'; expect(await ensureContactPermission()).toBe('authorized');
    expect(mocks.androidRequest).toHaveBeenCalledWith('android.permission.READ_CONTACTS');
    expect(mocks.request).not.toHaveBeenCalled();
    mocks.androidCheck.mockResolvedValue(true); await ensureContactPermission();
    expect(mocks.androidRequest).toHaveBeenCalledOnce();
  });
  it('preserves Android denial and never-ask-again without pretending access was granted', async () => {
    mocks.os = 'android'; mocks.androidRequest.mockResolvedValue('never_ask_again');
    expect(await ensureContactPermission()).toBe('denied');
  });
});
