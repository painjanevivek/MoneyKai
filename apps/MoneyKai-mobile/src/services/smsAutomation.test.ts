import { beforeEach, describe, expect, it, vi } from 'vitest';
import { startSmsParsing, turnOffSmsAutomation, turnOnSmsAutomation, updateSmsAutomationInterval } from './smsAutomation';
import { SMS_CONSENT_VERSION } from '@/constants/smsConsent';

const mocks = vi.hoisted(() => ({
  supported: true, owner: 'owner', budget: 10000,
  settings: { autoCaptureEnabled: false, smsResearchModeEnabled: false, notificationCaptureEnabled: false, smsParseIntervalMinutes: 60, smsConsentVersion: '', smsConsentUserId: '', smsResearchExplainerAcceptedAt: '' },
  permission: vi.fn(), schedule: vi.fn(), sources: vi.fn(), import: vi.fn(), accept: vi.fn(),
}));
vi.mock('@/config/environment', () => ({ isNativeSmsResearchBuildEnabled: () => mocks.supported }));
vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: { getState: () => ({ user: { id: mocks.owner } }) } }));
vi.mock('@/stores/useBudgetStore', () => ({ useBudgetStore: { getState: () => ({ settings: { monthly_allowance: mocks.budget } }) } }));
vi.mock('@/services/nativeCaptureBridge', () => ({ configureNativeSmsSchedule: mocks.schedule, requestNativeSmsPermission: mocks.permission, setNativeCaptureSourcesEnabled: mocks.sources }));
vi.mock('@/services/autoCaptureService', () => ({ importRecentSmsTransactionsFromInbox: mocks.import }));
vi.mock('@/stores/useCaptureStore', () => ({ useCaptureStore: { getState: () => ({
  settings: mocks.settings,
  acceptSmsResearchExplainer: () => { mocks.accept(); Object.assign(mocks.settings, { smsConsentVersion: SMS_CONSENT_VERSION, smsConsentUserId: mocks.owner, smsResearchExplainerAcceptedAt: '2026-09-30T09:00:00Z' }); },
  setSmsAccessStatus: vi.fn(),
  setAutoCaptureEnabled: (enabled: boolean) => { mocks.settings.autoCaptureEnabled = enabled; },
  setSmsResearchModeEnabled: (enabled: boolean) => { mocks.settings.smsResearchModeEnabled = enabled; },
  setSmsParseIntervalMinutes: (minutes: number) => { mocks.settings.smsParseIntervalMinutes = minutes; },
}) } }));

beforeEach(() => {
  vi.clearAllMocks(); mocks.supported = true; mocks.owner = 'owner'; mocks.budget = 10000;
  Object.assign(mocks.settings, { autoCaptureEnabled: false, smsResearchModeEnabled: false, notificationCaptureEnabled: false, smsParseIntervalMinutes: 60, smsConsentVersion: '', smsConsentUserId: '', smsResearchExplainerAcceptedAt: '' });
  mocks.permission.mockResolvedValue('granted'); mocks.schedule.mockResolvedValue(true); mocks.sources.mockResolvedValue(true);
  mocks.import.mockResolvedValue({ status: 'imported', scannedCount: 4, draftedCount: 2, duplicateCount: 1, pendingAccountApprovalCount: 0, parserIgnoredCount: 0 });
});
describe('consent-gated SMS automation', () => {
  it('never requests access in an unsupported build', async () => {
    mocks.supported = false; await turnOnSmsAutomation(true);
    expect(mocks.permission).not.toHaveBeenCalled(); expect(mocks.schedule).not.toHaveBeenCalled();
  });
  it('requires the prominent disclosure and a budget before the OS prompt', async () => {
    await turnOnSmsAutomation(false); mocks.budget = 0; await turnOnSmsAutomation(true);
    expect(mocks.permission).not.toHaveBeenCalled();
  });
  it('keeps automatic reading off when access is denied', async () => {
    mocks.permission.mockResolvedValue('denied'); await turnOnSmsAutomation(true);
    expect(mocks.settings.smsResearchModeEnabled).toBe(false); expect(mocks.schedule).not.toHaveBeenCalled();
    expect(mocks.import).not.toHaveBeenCalled();
  });
  it('schedules the selected interval only after permission', async () => {
    mocks.settings.smsParseIntervalMinutes = 15; await turnOnSmsAutomation(true);
    expect(mocks.permission).toHaveBeenCalledWith(true); expect(mocks.schedule).toHaveBeenCalledWith(true, 15, 'owner');
    expect(mocks.settings.smsResearchModeEnabled).toBe(true);
    expect(mocks.import).toHaveBeenCalledOnce();
    expect(mocks.permission.mock.invocationCallOrder[0]).toBeLessThan(mocks.import.mock.invocationCallOrder[0]);
  });
  it('reuses consent after Off and On rather than asking for the disclosure again', async () => {
    await turnOnSmsAutomation(true);
    const acceptedAt = mocks.settings.smsResearchExplainerAcceptedAt;
    await turnOffSmsAutomation();
    await turnOnSmsAutomation(false);
    expect(mocks.settings.smsResearchModeEnabled).toBe(true);
    expect(mocks.settings.smsResearchExplainerAcceptedAt).toBe(acceptedAt);
    expect(mocks.accept).toHaveBeenCalledOnce();
  });
  it.each(['different-owner', 'old-version'])('does not reuse consent for %s', async (condition) => {
    await turnOnSmsAutomation(true); await turnOffSmsAutomation(); mocks.permission.mockClear();
    if (condition === 'different-owner') mocks.owner = 'other';
    else mocks.settings.smsConsentVersion = 'old';
    await turnOnSmsAutomation(false);
    expect(mocks.permission).not.toHaveBeenCalled();
    expect(mocks.settings.smsResearchModeEnabled).toBe(false);
  });
  it('rolls back On if native scheduling fails', async () => {
    mocks.schedule.mockResolvedValue(false); await turnOnSmsAutomation(true);
    expect(mocks.settings.smsResearchModeEnabled).toBe(false);
    expect(mocks.schedule).toHaveBeenCalledWith(false, 60, '');
    expect(mocks.import).not.toHaveBeenCalled();
  });
  it('does not pretend native capture is enabled when its source switch fails', async () => {
    mocks.sources.mockResolvedValueOnce(false);
    const message = await turnOnSmsAutomation(true);
    expect(message).toContain('Could not enable');
    expect(mocks.settings.smsResearchModeEnabled).toBe(false);
    expect(mocks.import).not.toHaveBeenCalled();
  });
  it('Off cancels a permission request completion rather than turning On again', async () => {
    let resolve!: (value: string) => void;
    mocks.permission.mockReturnValue(new Promise<string>((done) => { resolve = done; }));
    const on = turnOnSmsAutomation(true); await turnOffSmsAutomation(); resolve('granted'); await on;
    expect(mocks.settings.smsResearchModeEnabled).toBe(false);
    expect(mocks.schedule).not.toHaveBeenCalledWith(true, expect.anything(), expect.anything());
  });
  it('does not start a scan while Off', async () => {
    await startSmsParsing(); expect(mocks.import).not.toHaveBeenCalled();
  });
  it('does not enable access for a different owner after a permission response', async () => {
    mocks.permission.mockImplementationOnce(async () => { mocks.owner = 'other-owner'; return 'granted'; });
    await turnOnSmsAutomation(true);
    expect(mocks.settings.smsResearchModeEnabled).toBe(false);
    expect(mocks.schedule).not.toHaveBeenCalled();
  });
  it('turns Off if changing the active schedule fails', async () => {
    await turnOnSmsAutomation(true);
    mocks.schedule.mockResolvedValue(false);
    await updateSmsAutomationInterval(30);
    expect(mocks.settings.smsResearchModeEnabled).toBe(false);
  });
  it('persists an interval while Off without asking for permission or scheduling', async () => {
    await updateSmsAutomationInterval(30);
    expect(mocks.settings.smsParseIntervalMinutes).toBe(30);
    expect(mocks.schedule).not.toHaveBeenCalled(); expect(mocks.permission).not.toHaveBeenCalled();
  });
  it('returns reviewable drafts without confirming or posting them', async () => {
    await turnOnSmsAutomation(true); const result = await startSmsParsing();
    expect(result.needsReview).toBe(true); expect(result.message).toContain('2 new drafts');
  });
  it('prevents rapid duplicate Start Parsing calls', async () => {
    await turnOnSmsAutomation(true);
    mocks.import.mockClear();
    let finish!: (value: object) => void;
    mocks.import.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const first = startSmsParsing(); const second = await startSmsParsing();
    expect(second.message).toContain('already running'); expect(mocks.import).toHaveBeenCalledTimes(1);
    finish({ status: 'imported', draftedCount: 0, duplicateCount: 0 }); await first;
  });
  it('reports real scan progress and account approval from the first On operation', async () => {
    const progress = { phase: 'discovering_accounts', scannedCount: 25, eligibleCount: 1, draftedCount: 0, duplicateCount: 0, parserIgnoredCount: 0, pageCount: 1 };
    mocks.import.mockImplementationOnce(async (_range, report) => {
      report(progress);
      return { status: 'needs_account_approval', scannedCount: 25, draftedCount: 0, pendingAccountApprovalCount: 1 };
    });
    const onProgress = vi.fn(); const onResult = vi.fn();
    const message = await turnOnSmsAutomation(true, { onProgress, onResult });
    expect(onProgress).toHaveBeenCalledWith(progress);
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ needsAccountApproval: true, needsReview: false }));
    expect(message).toContain('25 inbox messages checked');
  });
  it('Off invalidates an in-flight inbox read, even if turned On again later', async () => {
    await turnOnSmsAutomation(true);
    let finish!: (value: object) => void;
    let canContinue!: () => boolean;
    mocks.import.mockImplementationOnce((_range, _progress, guard) => {
      canContinue = guard;
      return new Promise(resolve => { finish = resolve; });
    });
    const scan = startSmsParsing();
    expect(canContinue()).toBe(true);
    await turnOffSmsAutomation();
    expect(canContinue()).toBe(false);
    finish({ status: 'imported', draftedCount: 5, pendingAccountApprovalCount: 0 });
    expect(await scan).toMatchObject({ needsReview: false, needsAccountApproval: false, message: 'Message check stopped.' });
  });
  it('turns Off rather than leaving On displayed after SMS permission is revoked', async () => {
    await turnOnSmsAutomation(true);
    mocks.import.mockResolvedValueOnce({ status: 'permission_denied', pendingAccountApprovalCount: 0 });
    await startSmsParsing();
    expect(mocks.settings.smsResearchModeEnabled).toBe(false);
    expect(mocks.schedule).toHaveBeenLastCalledWith(false, 60, '');
  });
});
