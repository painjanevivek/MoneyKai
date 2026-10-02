import { isNativeSmsResearchBuildEnabled } from '@/config/environment';
import { hasCurrentSmsConsent } from '@/constants/smsConsent';
import { normalizeSmsInterval } from '@/constants/smsSchedule';
import { configureNativeSmsSchedule, requestNativeSmsPermission, setNativeCaptureSourcesEnabled } from '@/services/nativeCaptureBridge';
import { importRecentSmsTransactionsFromInbox, type SmsInboxImportSummary } from '@/services/autoCaptureService';
import type { SmsImportProgress } from '@/types/smsImport';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCaptureStore } from '@/stores/useCaptureStore';

let changing = false;
let scanning = false;
let revision = 0;
export interface SmsScanResult {
  message: string;
  needsReview: boolean;
  needsAccountApproval: boolean;
  summary?: SmsInboxImportSummary;
}
export interface SmsScanCallbacks {
  onProgress?: (progress: SmsImportProgress) => void;
  onResult?: (result: SmsScanResult) => void;
}
export const smsAutomationIsOn = () => {
  const { settings } = useCaptureStore.getState();
  return isNativeSmsResearchBuildEnabled() && settings.autoCaptureEnabled && settings.smsResearchModeEnabled && hasCurrentSmsConsent(settings, useAuthStore.getState().user?.id);
};
export async function turnOffSmsAutomation() {
  revision += 1; // Cancel permission/import completions that started before Off.
  const store = useCaptureStore.getState();
  store.setSmsResearchModeEnabled(false);
  await setNativeCaptureSourcesEnabled({ notificationEnabled: store.settings.autoCaptureEnabled && store.settings.notificationCaptureEnabled, smsEnabled: false });
  await configureNativeSmsSchedule(false, 60, '');
  return 'Automatic reading is off. Saved records and Android permission are unchanged.';
}
export async function turnOnSmsAutomation(disclosureAccepted: boolean, callbacks: SmsScanCallbacks = {}) {
  if (changing) return 'SMS setup is already in progress.';
  if (!isNativeSmsResearchBuildEnabled()) return 'Automatic reading needs the internal SMS-enabled build. Manual parsing works in this build.';
  const owner = useAuthStore.getState().user?.id;
  if (!owner) return 'Sign in before turning on automatic reading.';
  const consentIsCurrent = hasCurrentSmsConsent(useCaptureStore.getState().settings, owner);
  if (!disclosureAccepted && !consentIsCurrent) return 'Review and accept the SMS disclosure first.';
  if (useBudgetStore.getState().settings.monthly_allowance <= 0) return 'Set a monthly budget first.';
  changing = true;
  const started = revision;
  try {
    useCaptureStore.getState().setSmsResearchModeEnabled(false);
    if (!consentIsCurrent) useCaptureStore.getState().acceptSmsResearchExplainer();
    const permission = await requestNativeSmsPermission(true);
    useCaptureStore.getState().setSmsAccessStatus(permission);
    if (started !== revision || useAuthStore.getState().user?.id !== owner) return 'Setup was cancelled. Automatic reading stays off.';
    if (permission !== 'granted') return 'SMS access was not granted. You can still paste a message manually.';
    const store = useCaptureStore.getState();
    store.setAutoCaptureEnabled(true);
    store.setSmsResearchModeEnabled(true);
    const activated = await setNativeCaptureSourcesEnabled({ notificationEnabled: store.settings.notificationCaptureEnabled, smsEnabled: true });
    if (!activated) { await turnOffSmsAutomation(); return 'Could not enable device SMS capture. Automatic reading stays off; try again.'; }
    const scheduled = await configureNativeSmsSchedule(true, normalizeSmsInterval(store.settings.smsParseIntervalMinutes), owner);
    if (started !== revision || useAuthStore.getState().user?.id !== owner) { await turnOffSmsAutomation(); return 'Setup was cancelled. Automatic reading stays off.'; }
    if (!scheduled) { await turnOffSmsAutomation(); return 'Could not schedule SMS checks. Automatic reading stays off; try again.'; }
    // Permission is not an import. Read the inbox now, not only on a later button tap/job.
    const result = await startSmsParsing(callbacks.onProgress);
    callbacks.onResult?.(result);
    if (started !== revision || useAuthStore.getState().user?.id !== owner) return 'Message check stopped. Automatic reading is off.';
    return `Automatic reading is on. ${result.message}`;
  } catch { await turnOffSmsAutomation(); return 'SMS setup could not finish. Automatic reading stays off.'; }
  finally { changing = false; }
}
export async function startSmsParsing(onProgress?: (progress: SmsImportProgress) => void): Promise<SmsScanResult> {
  if (scanning) return { message: 'A message check is already running.', needsReview: false, needsAccountApproval: false };
  if (!smsAutomationIsOn()) return { message: 'Turn automatic reading on and grant SMS access first.', needsReview: false, needsAccountApproval: false };
  scanning = true;
  const started = revision;
  const owner = useAuthStore.getState().user?.id;
  try {
    const result = await importRecentSmsTransactionsFromInbox(undefined, onProgress, () => started === revision);
    if (started !== revision || owner !== useAuthStore.getState().user?.id) return { message: 'Message check stopped.', needsReview: false, needsAccountApproval: false };
    if (result.status === 'permission_denied') await turnOffSmsAutomation();
    const needsAccountApproval = result.pendingAccountApprovalCount > 0;
    const counts = `${result.scannedCount} inbox messages checked. ${result.confirmedCount ?? 0} transactions auto-added. ${result.draftedCount} new drafts ready to review. ${result.duplicateCount} already-seen messages skipped.`;
    return { summary: result, needsReview: result.draftedCount > 0, needsAccountApproval, message: result.status === 'needs_account_approval'
      ? `${result.scannedCount} inbox messages checked. Choose the found bank accounts to allow transaction parsing.`
      : result.status === 'imported' ? `${counts}${needsAccountApproval ? ' Other bank accounts need your approval.' : ''}${result.message ? ` ${result.message}` : ''}${result.parserIgnoredCount ? ` ${result.parserIgnoredCount} candidate messages could not be safely parsed.` : ''}`
      : result.status === 'permission_denied' ? 'SMS access is unavailable. Grant permission in Android Settings or use manual parsing.'
      : result.status === 'ignored' ? 'Message check stopped. Check that automatic reading is on and your session is still active.'
      : 'Could not check messages. Try again or use manual parsing.' };
  } catch { return { message: 'Could not check messages. Try again or use manual parsing.', needsReview: false, needsAccountApproval: false }; }
  finally { scanning = false; }
}

export async function updateSmsAutomationInterval(minutes: number) {
  const interval = normalizeSmsInterval(minutes);
  useCaptureStore.getState().setSmsParseIntervalMinutes(interval);
  if (!smsAutomationIsOn()) return 'Interval saved. Turn On to start automatic checks.';
  const owner = useAuthStore.getState().user?.id ?? '';
  if (await configureNativeSmsSchedule(true, interval, owner)) return 'Automatic check interval updated. Android may delay checks to save battery.';
  await turnOffSmsAutomation();
  return 'Could not update the schedule. Automatic reading is off; try turning it on again.';
}
