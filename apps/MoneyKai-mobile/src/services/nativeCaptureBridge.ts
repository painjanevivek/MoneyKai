import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { runPermissionFlow } from './permissionFlow';
import { getSmsImportRangeOption } from '@/constants/smsImportRanges';
import { captureDiagnosticEvent, captureException } from '@/services/diagnosticsService';
import type { CaptureSignalInput } from '@/types/capture';
import type { SmsImportRangeId } from '@/types/smsImport';

export type NativeCapturePermissionStatus = 'unsupported' | 'not_requested' | 'granted' | 'denied';

export interface NativeCaptureStatus {
  platform: 'android' | 'ios' | 'web' | 'unknown';
  notificationAccess: NativeCapturePermissionStatus;
  smsAccess: NativeCapturePermissionStatus;
  smsInboxAccess?: NativeCapturePermissionStatus;
  nativeModuleAvailable: boolean;
  notificationCaptureAvailable?: boolean;
}

export interface NativeSmsImportResult {
  status: 'imported' | 'permission_denied' | 'unsupported' | 'error';
  importedCount: number;
  scannedCount: number;
  ignoredCount: number;
  signals: CaptureSignalInput[];
  hasMore: boolean;
  nextCursor?: string;
  message?: string;
}

export interface NativeSmsAccountDiscoveryResult {
  status: 'imported' | 'permission_denied' | 'unsupported' | 'error';
  discoveredCount: number;
  scannedCount: number;
  ignoredCount: number;
  signals: CaptureSignalInput[];
  hasMore: boolean;
  nextCursor?: string;
  message?: string;
}

type NativeCaptureSubscription = {
  remove: () => void;
};

type NativeCaptureSignal = {
  source?: 'notification' | 'sms';
  title?: string;
  body?: string;
  sourceApp?: string;
  sender?: string;
  receivedAt?: string;
  rawPackageName?: string;
  privacyStatus?: string;
  captureOrigin?: string;
  rawBodyStored?: string;
  smsMessageId?: string;
  smsSubscriptionId?: string;
  smsSlot?: string;
  smsPhoneId?: string;
  smsOwnerId?: string;
  notificationOwnerId?: string;
  notificationId?: string;
  notificationReferenceHash?: string;
  smsReferenceHash?: string;
  smsAutoRecordSafe?: boolean | string;
  smsAccountHint?: string;
  discoverySampleRedactedBody?: string;
  discoverySampleSender?: string;
  discoverySampleReceivedAt?: string;
  discoverySampleMessageId?: string;
  sampleCount?: number;
  lastSeenAt?: string;
};

type NativeSmsAccountDiscoveryPayload = {
  status?: NativeSmsAccountDiscoveryResult['status'];
  discoveredCount?: number;
  scannedCount?: number;
  ignoredCount?: number;
  accounts?: NativeCaptureSignal[];
  hasMore?: boolean;
  nextCursor?: string;
  message?: string;
};

type NativeSmsImportPayload = {
  status?: NativeSmsImportResult['status'];
  importedCount?: number;
  scannedCount?: number;
  ignoredCount?: number;
  signals?: NativeCaptureSignal[];
  hasMore?: boolean;
  nextCursor?: string;
  message?: string;
};

type NativeSmsScanParams = {
  rangeId?: SmsImportRangeId;
  days?: number;
  sinceMillis?: number;
  maxMessages?: number;
  pageSize?: number;
  cursor?: string;
};

type MoneyKaiNativeCaptureEvents = {
  onNotificationSignal: (event: NativeCaptureSignal) => void;
};

type MoneyKaiNativeCaptureModule = {
  pickPaymentStatement?: () => Promise<{ name: string; text: string } | null>;
  setPaymentNotificationPackages?: (packagesJson: string, ownerId: string) => boolean;
  configureSmsSchedule?: (enabled: boolean, intervalMinutes: number, ownerId: string) => Promise<boolean>;
  startListening?: () => boolean;
  stopListening?: () => boolean;
  clearPendingSignals?: () => boolean;
  setCaptureEnabled?: (enabled: boolean) => boolean;
  setCaptureSourcesEnabled?: (notificationEnabled: boolean, smsEnabled: boolean) => boolean;
  setApprovedSmsAccounts?: (approvedAccountIdsJson: string) => boolean;
  getStatus?: () => NativeCaptureStatus;
  discoverRecentSmsAccounts?: (optionsJson: string) => Promise<string>;
  importRecentSmsTransactions?: (optionsJson: string, approvedAccountIdsJson: string) => Promise<string>;
  openNotificationListenerSettings?: () => boolean;
  getDefaultWebClientId?: () => Promise<string>;
  addListener?: (eventName: keyof MoneyKaiNativeCaptureEvents) => void;
  removeListeners?: (count: number) => void;
};

const nativeCaptureModule = NativeModules.MoneyKaiNativeCapture as MoneyKaiNativeCaptureModule | undefined;

export async function pickPaymentStatement() {
  if (Platform.OS !== 'android' || !nativeCaptureModule?.pickPaymentStatement) {
    throw new Error('Statement import needs the updated MoneyKai Android app.');
  }
  return nativeCaptureModule.pickPaymentStatement();
}

export async function setPaymentNotificationPackages(packages: string[], ownerId = '') {
  if (!nativeCaptureModule?.setPaymentNotificationPackages) return false;
  try { return nativeCaptureModule.setPaymentNotificationPackages(JSON.stringify(packages), ownerId); }
  catch { return false; }
}
const nativeCaptureEvents = nativeCaptureModule ? new NativeEventEmitter(nativeCaptureModule as never) : null;

export async function configureNativeSmsSchedule(enabled: boolean, intervalMinutes: number, ownerId: string): Promise<boolean> {
  if (Platform.OS !== 'android' || !nativeCaptureModule?.configureSmsSchedule) return false;
  try {
    // Await encrypted Zustand writes before a job can run (periodic jobs may
    // execute immediately). Off must not wait for a possibly unreadable store.
    if (enabled) {
      const { privateDeviceStorage } = await import('./privateDeviceStorage');
      await privateDeviceStorage.getItem('moneykai-auto-capture');
    }
    return await nativeCaptureModule.configureSmsSchedule(enabled, intervalMinutes, ownerId);
  }
  catch { return false; }
}

const fallbackStatus: NativeCaptureStatus = {
  platform: Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web' ? Platform.OS : 'unknown',
  notificationAccess: Platform.OS === 'android' ? 'not_requested' : 'unsupported',
  smsAccess: 'unsupported',
  smsInboxAccess: 'unsupported',
  nativeModuleAvailable: false,
};

const captureNativeFailure = (
  operation: string,
  error: unknown,
  metadata?: Record<string, unknown>,
  severity: 'warning' | 'error' = 'error'
) =>
  captureException(error, {
    scope: `nativeCapture.${operation}`,
    message: `Native capture ${operation} failed`,
    severity,
    metadata,
  });

const parseNativeJson = <T extends object>(
  operation: string,
  rawResult: string,
  fallback: T
): T => {
  try {
    return JSON.parse(rawResult) as T;
  } catch (error) {
    captureNativeFailure(operation, error, { rawResultLength: rawResult.length });
    return fallback;
  }
};

export const getNativeCaptureStatus = async (): Promise<NativeCaptureStatus> => {
  if (!nativeCaptureModule?.getStatus) {
    return fallbackStatus;
  }

  try {
    return nativeCaptureModule.getStatus();
  } catch (error) {
    captureNativeFailure('getStatus', error);
    return {
      ...fallbackStatus,
      nativeModuleAvailable: true,
    };
  }
};

export const getNativeGoogleWebClientId = async (): Promise<string> => {
  if (Platform.OS !== 'android' || !nativeCaptureModule?.getDefaultWebClientId) {
    return '';
  }

  try {
    const webClientId = await nativeCaptureModule.getDefaultWebClientId();
    return webClientId.trim();
  } catch (error) {
    captureNativeFailure('getDefaultWebClientId', error, undefined, 'warning');
    return '';
  }
};

export const requestNativeSmsPermission = (disclosureAccepted = false): Promise<NativeCapturePermissionStatus> => {
  if (!disclosureAccepted) return Promise.resolve('not_requested');
  return runPermissionFlow('sms', requestSmsPermission);
};

const requestSmsPermission = async (): Promise<NativeCapturePermissionStatus> => {
  if (Platform.OS !== 'android' || !nativeCaptureModule?.getStatus) {
    return 'unsupported';
  }

  let currentStatus: NativeCaptureStatus;
  try {
    currentStatus = nativeCaptureModule.getStatus();
  } catch (error) {
    captureNativeFailure('requestSmsPermission.status', error);
    return 'unsupported';
  }
  if (currentStatus.smsAccess === 'unsupported' || currentStatus.smsInboxAccess === 'unsupported') {
    return 'unsupported';
  }

  const receivePermission = PermissionsAndroid.PERMISSIONS.RECEIVE_SMS;
  const readPermission = PermissionsAndroid.PERMISSIONS.READ_SMS;
  let receiveGranted = false;
  let readGranted = false;
  try {
    receiveGranted = await PermissionsAndroid.check(receivePermission);
    readGranted = await PermissionsAndroid.check(readPermission);
  } catch (error) {
    captureNativeFailure('requestSmsPermission.check', error);
    return 'denied';
  }

  if (receiveGranted && readGranted) {
    return 'granted';
  }

  let receiveResult = PermissionsAndroid.RESULTS.DENIED;
  let readResult = PermissionsAndroid.RESULTS.DENIED;
  try {
    receiveResult = receiveGranted
      ? PermissionsAndroid.RESULTS.GRANTED
      : await PermissionsAndroid.request(receivePermission, {
          title: 'Allow SMS Capture',
          message:
            'MoneyKai needs SMS receive access to create reviewable drafts from bank transaction SMS.',
          buttonPositive: 'Allow',
          buttonNegative: 'Not now',
        });
    if (receiveResult !== PermissionsAndroid.RESULTS.GRANTED) return 'denied';
    // Android may have granted both permissions together. Recheck before another prompt.
    readGranted = await PermissionsAndroid.check(readPermission);
    readResult = readGranted
      ? PermissionsAndroid.RESULTS.GRANTED
      : await PermissionsAndroid.request(readPermission, {
          title: 'Import Recent Bank SMS',
          message:
            'Allow MoneyKai to read bank and payment SMS for the range you choose. Access remains granted until you revoke it in Android Settings.',
          buttonPositive: 'Allow',
          buttonNegative: 'Not now',
        });
  } catch (error) {
    captureNativeFailure('requestSmsPermission.request', error);
    return 'denied';
  }
  const nextReceiveGranted = receiveResult === PermissionsAndroid.RESULTS.GRANTED;
  const nextReadGranted = readResult === PermissionsAndroid.RESULTS.GRANTED;

  return nextReceiveGranted && nextReadGranted ? 'granted' : 'denied';
};

const emptySmsImportResult = (
  status: NativeSmsImportResult['status'],
  message?: string
): NativeSmsImportResult => ({
  status,
  importedCount: 0,
  scannedCount: 0,
  ignoredCount: 0,
  signals: [],
  hasMore: false,
  message,
});

const emptySmsAccountDiscoveryResult = (
  status: NativeSmsAccountDiscoveryResult['status'],
  message?: string
): NativeSmsAccountDiscoveryResult => ({
  status,
  discoveredCount: 0,
  scannedCount: 0,
  ignoredCount: 0,
  signals: [],
  hasMore: false,
  message,
});

const buildNativeSmsScanOptions = (params?: NativeSmsScanParams) => {
  const range = getSmsImportRangeOption(params?.rangeId);
  const maxMessages = Math.min(
    range.maxMessages,
    Math.max(1, Math.round(params?.maxMessages ?? range.maxMessages))
  );
  const pageSize = Math.min(
    maxMessages,
    range.pageSize,
    Math.max(1, Math.round(params?.pageSize ?? range.pageSize))
  );

  return {
    rangeId: range.id,
    days: params?.days ?? range.days ?? 0,
    sinceMillis: params?.sinceMillis ?? 0,
    maxMessages,
    pageSize,
    cursor: params?.cursor,
  };
};

export const discoverRecentNativeSmsAccounts = async (params?: NativeSmsScanParams): Promise<NativeSmsAccountDiscoveryResult> => {
  if (Platform.OS !== 'android' || !nativeCaptureModule?.discoverRecentSmsAccounts) {
    return emptySmsAccountDiscoveryResult('unsupported', 'SMS account discovery requires an Android development build.');
  }

  const options = buildNativeSmsScanOptions(params);
  let rawResult: string;
  try {
    rawResult = await nativeCaptureModule.discoverRecentSmsAccounts(JSON.stringify(options));
  } catch (error) {
    captureNativeFailure('discoverRecentSmsAccounts', error, options);
    return emptySmsAccountDiscoveryResult('error', 'The Android SMS account discovery request failed.');
  }
  const parsed = parseNativeJson<NativeSmsAccountDiscoveryPayload>(
    'discoverRecentSmsAccounts.parse',
    rawResult,
    {
      status: 'error' as const,
      message: 'The Android SMS account discovery response could not be parsed.',
    }
  );

  return {
    status: parsed.status ?? 'error',
    discoveredCount: parsed.discoveredCount ?? 0,
    scannedCount: parsed.scannedCount ?? 0,
    ignoredCount: parsed.ignoredCount ?? 0,
    hasMore: parsed.hasMore === true,
    nextCursor: parsed.nextCursor,
    message: parsed.message,
    signals: (parsed.accounts ?? [])
      .map(mapNativeAccountToCaptureSignal)
      .filter((signal): signal is CaptureSignalInput => Boolean(signal)),
  };
};

export const importRecentNativeSmsTransactions = async (params?: {
  rangeId?: SmsImportRangeId;
  days?: number;
  sinceMillis?: number;
  maxMessages?: number;
  pageSize?: number;
  cursor?: string;
  approvedAccountIds?: string[];
}): Promise<NativeSmsImportResult> => {
  if (Platform.OS !== 'android' || !nativeCaptureModule?.importRecentSmsTransactions) {
    return emptySmsImportResult('unsupported', 'SMS inbox import requires an Android development build.');
  }

  const options = buildNativeSmsScanOptions(params);
  const approvedAccountIdsJson = JSON.stringify(params?.approvedAccountIds ?? []);
  let rawResult: string;
  try {
    rawResult = await nativeCaptureModule.importRecentSmsTransactions(JSON.stringify(options), approvedAccountIdsJson);
  } catch (error) {
    captureNativeFailure('importRecentSmsTransactions', error, {
      ...options,
      approvedAccountCount: params?.approvedAccountIds?.length ?? 0,
    });
    return emptySmsImportResult('error', 'The Android SMS import request failed.');
  }
  const parsed = parseNativeJson<NativeSmsImportPayload>(
    'importRecentSmsTransactions.parse',
    rawResult,
    {
      status: 'error' as const,
      message: 'The Android SMS import response could not be parsed.',
    }
  );

  return {
    status: parsed.status ?? 'error',
    importedCount: parsed.importedCount ?? 0,
    scannedCount: parsed.scannedCount ?? 0,
    ignoredCount: parsed.ignoredCount ?? 0,
    hasMore: parsed.hasMore === true,
    nextCursor: parsed.nextCursor,
    message: parsed.message,
    signals: (parsed.signals ?? [])
      .map(mapNativeSignalToCaptureSignal)
      .filter((signal): signal is CaptureSignalInput => Boolean(signal)),
  };
};

export const openNativeCaptureSettings = async () => {
  if (!nativeCaptureModule?.openNotificationListenerSettings) {
    return false;
  }

  try {
    return nativeCaptureModule.openNotificationListenerSettings();
  } catch (error) {
    captureNativeFailure('openNotificationListenerSettings', error);
    return false;
  }
};

export const clearNativeCaptureQueue = async () => {
  if (!nativeCaptureModule?.clearPendingSignals) {
    return false;
  }

  try {
    return nativeCaptureModule.clearPendingSignals();
  } catch (error) {
    captureNativeFailure('clearPendingSignals', error);
    return false;
  }
};

export const setNativeCaptureEnabled = async (enabled: boolean) => {
  if (!nativeCaptureModule?.setCaptureEnabled) {
    return false;
  }

  try {
    return nativeCaptureModule.setCaptureEnabled(enabled);
  } catch (error) {
    captureNativeFailure('setCaptureEnabled', error, { enabled });
    return false;
  }
};

export const setNativeCaptureSourcesEnabled = async (params: {
  notificationEnabled: boolean;
  smsEnabled: boolean;
}) => {
  if (nativeCaptureModule?.setCaptureSourcesEnabled) {
    try {
      const result = nativeCaptureModule.setCaptureSourcesEnabled(params.notificationEnabled, params.smsEnabled);
      captureDiagnosticEvent({
        scope: 'nativeCapture.setSources',
        message: 'Native capture source state changed',
        severity: 'info',
        metadata: params,
      });
      return result;
    } catch (error) {
      captureNativeFailure('setCaptureSourcesEnabled', error, params);
      return false;
    }
  }

  return setNativeCaptureEnabled(params.notificationEnabled);
};

export const setNativeApprovedSmsAccounts = async (approvedAccountIds: string[]) => {
  if (!nativeCaptureModule?.setApprovedSmsAccounts) {
    return false;
  }

  try {
    return nativeCaptureModule.setApprovedSmsAccounts(JSON.stringify(approvedAccountIds));
  } catch (error) {
    captureNativeFailure('setApprovedSmsAccounts', error, { approvedAccountCount: approvedAccountIds.length });
    return false;
  }
};

export const subscribeToNativeCaptureSignals = (
  handler: (signal: CaptureSignalInput) => void
): NativeCaptureSubscription => {
  if (!nativeCaptureEvents) {
    return { remove: () => undefined };
  }
  const module = nativeCaptureModule;
  if (!module) {
    return { remove: () => undefined };
  }

  let subscription: NativeCaptureSubscription;
  try {
    subscription = nativeCaptureEvents.addListener('onNotificationSignal', (event: NativeCaptureSignal) => {
      try {
        const signal = mapNativeSignalToCaptureSignal(event);
        if (signal) {
          handler(signal);
        }
      } catch (error) {
        captureNativeFailure('signalHandler', error, {
          source: event.source,
          sourceApp: event.sourceApp,
          privacyStatus: event.privacyStatus,
          captureOrigin: event.captureOrigin,
        });
      }
    });
  } catch (error) {
    captureNativeFailure('addListener', error);
    return { remove: () => undefined };
  }

  try {
    module.startListening?.();
    captureDiagnosticEvent({
      scope: 'nativeCapture.startListening',
      message: 'Native capture listener started',
      severity: 'info',
    });
  } catch (error) {
    captureNativeFailure('startListening', error);
  }

  return {
    remove: () => {
      try {
        subscription.remove();
      } catch (error) {
        captureNativeFailure('removeListener', error, undefined, 'warning');
      }
      try {
        module.stopListening?.();
        captureDiagnosticEvent({
          scope: 'nativeCapture.stopListening',
          message: 'Native capture listener stopped',
          severity: 'info',
        });
      } catch (error) {
        captureNativeFailure('stopListening', error);
      }
    },
  };
};

const mapNativeSignalToCaptureSignal = (event: NativeCaptureSignal): CaptureSignalInput | undefined => {
  const source = event.source === 'sms' ? 'sms' : 'notification';
  const body =
    event.body?.trim() ||
    (source === 'notification' && event.privacyStatus === 'content_hidden'
      ? 'Notification content hidden by Android privacy settings'
      : '');

  if (!body) return undefined;

  return {
    source,
    title: event.title,
    body,
    sourceApp: event.sourceApp,
    sender: event.sender,
    receivedAt: event.receivedAt,
    rawPayload: {
      rawPackageName: event.rawPackageName,
      privacyStatus: event.privacyStatus,
      captureOrigin: event.captureOrigin,
      rawBodyStored: event.rawBodyStored,
      smsMessageId: event.smsMessageId,
      smsSubscriptionId: event.smsSubscriptionId,
      smsSlot: event.smsSlot,
      smsPhoneId: event.smsPhoneId,
      smsOwnerId: event.smsOwnerId,
      notificationOwnerId: event.notificationOwnerId,
      notificationId: event.notificationId,
      notificationReferenceHash: event.notificationReferenceHash,
      smsReferenceHash: event.smsReferenceHash,
      smsAutoRecordSafe: event.smsAutoRecordSafe === true || event.smsAutoRecordSafe === 'true',
      smsAccountHint: event.smsAccountHint,
      discoverySampleRedactedBody: event.discoverySampleRedactedBody,
      discoverySampleSender: event.discoverySampleSender,
      discoverySampleReceivedAt: event.discoverySampleReceivedAt,
      discoverySampleMessageId: event.discoverySampleMessageId,
    },
  };
};

const mapNativeAccountToCaptureSignal = (event: NativeCaptureSignal): CaptureSignalInput | undefined => {
  const sender = event.sender?.trim();
  if (!sender) return undefined;

  return {
    source: 'sms',
    sender,
    body: event.discoverySampleRedactedBody?.trim() || 'Bank account approval preview',
    receivedAt: event.discoverySampleReceivedAt ?? event.lastSeenAt,
    rawPayload: {
      captureOrigin: 'android_sms_account_discovery',
      rawBodyStored: 'false',
      smsAccountHint: event.smsAccountHint,
      discoverySampleRedactedBody: event.discoverySampleRedactedBody,
      discoverySampleSender: event.discoverySampleSender ?? sender,
      discoverySampleReceivedAt: event.discoverySampleReceivedAt ?? event.lastSeenAt,
      discoverySampleMessageId: event.discoverySampleMessageId,
    },
  };
};
