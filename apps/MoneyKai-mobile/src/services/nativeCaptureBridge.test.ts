import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ status: vi.fn(), check: vi.fn(), request: vi.fn(), discover: vi.fn(), importSms: vi.fn(), pickStatement: vi.fn(), setPackages: vi.fn() }));
vi.mock('react-native', () => ({
  NativeModules: { MoneyKaiNativeCapture: { getStatus: mocks.status, discoverRecentSmsAccounts: mocks.discover, importRecentSmsTransactions: mocks.importSms, pickPaymentStatement: mocks.pickStatement, setPaymentNotificationPackages: mocks.setPackages } },
  NativeEventEmitter: class { addListener() { return { remove() {} }; } },
  Platform: { OS: 'android' },
  PermissionsAndroid: { PERMISSIONS: { RECEIVE_SMS: 'receive', READ_SMS: 'read' }, RESULTS: { GRANTED: 'granted', DENIED: 'denied' }, check: mocks.check, request: mocks.request },
}));
vi.mock('@/services/diagnosticsService', () => ({ captureDiagnosticEvent: vi.fn(), captureException: vi.fn() }));
import { discoverRecentNativeSmsAccounts, importRecentNativeSmsTransactions, requestNativeSmsPermission, pickPaymentStatement, setPaymentNotificationPackages } from './nativeCaptureBridge';

describe('payment statement and notification selection bridge', () => {
  it('binds selected payment apps to the current account', async () => {
    mocks.setPackages.mockReturnValue(true);
    expect(await setPaymentNotificationPackages(['com.phonepe.app'], 'owner')).toBe(true);
    expect(mocks.setPackages).toHaveBeenCalledWith('["com.phonepe.app"]', 'owner');
  });
  it('preserves file picker cancellation without inventing an empty statement', async () => {
    mocks.pickStatement.mockResolvedValue(null);
    expect(await pickPaymentStatement()).toBeNull();
  });
  it('surfaces unreadable PDF errors to the import review flow', async () => {
    mocks.pickStatement.mockRejectedValue(new Error('PDF has no readable text'));
    await expect(pickPaymentStatement()).rejects.toThrow('no readable text');
  });
  it('reports a failed native package selection update', async () => {
    mocks.setPackages.mockImplementation(() => { throw new Error('Unavailable'); });
    expect(await setPaymentNotificationPackages(['com.phonepe.app'])).toBe(false);
  });
});

describe('native SMS consent and asynchronous bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.status.mockReturnValue({ smsAccess: 'not_requested', smsInboxAccess: 'not_requested' });
    mocks.check.mockResolvedValue(false);
    mocks.request.mockResolvedValue('granted');
  });
  it('never opens Android SMS permission without affirmative disclosure consent', async () => {
    expect(await requestNativeSmsPermission()).toBe('not_requested');
    expect(mocks.status).not.toHaveBeenCalled();
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it('does not request SMS in a distribution without inbox support', async () => {
    mocks.status.mockReturnValue({ smsAccess: 'unsupported', smsInboxAccess: 'unsupported' });
    expect(await requestNativeSmsPermission(true)).toBe('unsupported');
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it('requests only read and receive when supported and explicitly agreed', async () => {
    expect(await requestNativeSmsPermission(true)).toBe('granted');
    expect(mocks.request.mock.calls.map(c => c[0])).toEqual(['receive', 'read']);
  });
  it('keeps denial distinct from permission success', async () => {
    mocks.request.mockResolvedValue('denied');
    expect(await requestNativeSmsPermission(true)).toBe('denied');
    expect(mocks.request).toHaveBeenCalledTimes(1);
    expect(mocks.request).not.toHaveBeenCalledWith('read', expect.anything());
  });
  it('checks live grants on every action without re-requesting access', async () => {
    mocks.check.mockResolvedValue(true);
    await requestNativeSmsPermission(true); await requestNativeSmsPermission(true);
    expect(mocks.request).not.toHaveBeenCalled();
    expect(mocks.check).toHaveBeenCalledTimes(4);
  });
  it('detects revocation even if a native status snapshot still says granted', async () => {
    mocks.status.mockReturnValue({ smsAccess: 'granted', smsInboxAccess: 'granted' });
    expect(await requestNativeSmsPermission(true)).toBe('granted');
    expect(mocks.request.mock.calls.map(c => c[0])).toEqual(['receive', 'read']);
  });
  it('requests only the missing SMS permission', async () => {
    mocks.check.mockImplementation(async (permission) => permission === 'receive');
    await requestNativeSmsPermission(true);
    expect(mocks.request.mock.calls.map(c => c[0])).toEqual(['read']);
  });
  it('rechecks SMS group grants before requesting read access', async () => {
    mocks.request.mockImplementation(async () => { mocks.check.mockResolvedValue(true); return 'granted'; });
    await requestNativeSmsPermission(true);
    expect(mocks.request.mock.calls.map(c => c[0])).toEqual(['receive']);
  });
  it('shares one SMS flow across rapid taps', async () => {
    await Promise.all(Array.from({ length: 20 }, () => requestNativeSmsPermission(true)));
    expect(mocks.request.mock.calls.map(c => c[0])).toEqual(['receive', 'read']);
  });
  it('awaits native account discovery and transaction scans rather than blocking synchronously', async () => {
    mocks.discover.mockResolvedValue(JSON.stringify({ status: 'imported', accounts: [], scannedCount: 3 }));
    mocks.importSms.mockResolvedValue(JSON.stringify({ status: 'imported', signals: [], scannedCount: 5 }));
    expect(await discoverRecentNativeSmsAccounts()).toMatchObject({ status: 'imported', scannedCount: 3, signals: [] });
    expect(await importRecentNativeSmsTransactions()).toMatchObject({ status: 'imported', scannedCount: 5, signals: [] });
  });
  it.each([true, 'true'])('preserves original-text validation metadata across JSON and queued string events: %s', async safe => {
    mocks.importSms.mockResolvedValue(JSON.stringify({ status: 'imported', signals: [{ source: 'sms', sender: 'AX-HDFCBK', body: 'Rs 299 debited to Cafe', smsAutoRecordSafe: safe, smsReferenceHash: 'a'.repeat(64) }] }));
    const result = await importRecentNativeSmsTransactions();
    expect(result.signals[0].rawPayload).toMatchObject({ smsAutoRecordSafe: true, smsReferenceHash: 'a'.repeat(64) });
  });
});
