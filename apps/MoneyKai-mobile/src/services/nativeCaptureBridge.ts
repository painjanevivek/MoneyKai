import { PermissionsAndroid, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import type { CaptureSignalInput } from '@/types/capture';

export type NativeCapturePermissionStatus = 'unsupported' | 'not_requested' | 'granted' | 'denied';

export interface NativeCaptureStatus {
  platform: 'android' | 'ios' | 'web' | 'unknown';
  notificationAccess: NativeCapturePermissionStatus;
  smsAccess: NativeCapturePermissionStatus;
  smsInboxAccess?: NativeCapturePermissionStatus;
  nativeModuleAvailable: boolean;
}

export interface NativeSmsImportResult {
  status: 'imported' | 'permission_denied' | 'unsupported' | 'error';
  importedCount: number;
  scannedCount: number;
  ignoredCount: number;
  signals: CaptureSignalInput[];
  message?: string;
}

export interface NativeSmsAccountDiscoveryResult {
  status: 'imported' | 'permission_denied' | 'unsupported' | 'error';
  discoveredCount: number;
  scannedCount: number;
  ignoredCount: number;
  signals: CaptureSignalInput[];
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
  smsAccountHint?: string;
  sampleCount?: number;
  lastSeenAt?: string;
};

type MoneyKaiNativeCaptureEvents = {
  onNotificationSignal: (event: NativeCaptureSignal) => void;
};

type MoneyKaiNativeCaptureModule = {
  startListening?: () => boolean;
  stopListening?: () => boolean;
  clearPendingSignals?: () => boolean;
  setCaptureEnabled?: (enabled: boolean) => boolean;
  setCaptureSourcesEnabled?: (notificationEnabled: boolean, smsEnabled: boolean) => boolean;
  setApprovedSmsAccounts?: (approvedAccountIdsJson: string) => boolean;
  getStatus?: () => NativeCaptureStatus;
  discoverRecentSmsAccounts?: (days: number, maxMessages: number) => string;
  importRecentSmsTransactions?: (days: number, maxMessages: number, approvedAccountIdsJson: string) => string;
  openNotificationListenerSettings?: () => boolean;
  addListener?: (
    eventName: keyof MoneyKaiNativeCaptureEvents,
    listener: MoneyKaiNativeCaptureEvents[keyof MoneyKaiNativeCaptureEvents]
  ) => NativeCaptureSubscription;
};

const nativeCaptureModule = requireOptionalNativeModule<MoneyKaiNativeCaptureModule>('MoneyKaiNativeCapture');

const fallbackStatus: NativeCaptureStatus = {
  platform: Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web' ? Platform.OS : 'unknown',
  notificationAccess: Platform.OS === 'android' ? 'not_requested' : 'unsupported',
  smsAccess: 'unsupported',
  smsInboxAccess: 'unsupported',
  nativeModuleAvailable: false,
};

export const getNativeCaptureStatus = async (): Promise<NativeCaptureStatus> => {
  if (!nativeCaptureModule?.getStatus) {
    return fallbackStatus;
  }

  return nativeCaptureModule.getStatus();
};

export const requestNativeSmsPermission = async (): Promise<NativeCapturePermissionStatus> => {
  if (Platform.OS !== 'android' || !nativeCaptureModule?.getStatus) {
    return 'unsupported';
  }

  const currentStatus = nativeCaptureModule.getStatus();
  const inboxStatus = currentStatus.smsInboxAccess ?? 'unsupported';
  if (currentStatus.smsAccess === 'unsupported') {
    return currentStatus.smsAccess;
  }

  const receivePermission = PermissionsAndroid.PERMISSIONS.RECEIVE_SMS;
  const readPermission = PermissionsAndroid.PERMISSIONS.READ_SMS;
  const receiveGranted = currentStatus.smsAccess === 'granted' || await PermissionsAndroid.check(receivePermission);
  const readGranted = inboxStatus === 'granted' || await PermissionsAndroid.check(readPermission);

  if (receiveGranted && readGranted) {
    return 'granted';
  }

  const receiveResult = receiveGranted
    ? PermissionsAndroid.RESULTS.GRANTED
    : await PermissionsAndroid.request(receivePermission, {
        title: 'Allow SMS Research Mode',
        message:
          'MoneyKai needs SMS receive access only in this internal research build to capture real bank transaction SMS.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      });
  const readResult = readGranted
    ? PermissionsAndroid.RESULTS.GRANTED
    : await PermissionsAndroid.request(readPermission, {
        title: 'Import Recent Bank SMS',
        message:
          'MoneyKai needs one-time SMS inbox access only in this internal research build to import the last 30 days of bank and payment transaction SMS.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      });
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
  message,
});

export const discoverRecentNativeSmsAccounts = async (params?: {
  days?: number;
  maxMessages?: number;
}): Promise<NativeSmsAccountDiscoveryResult> => {
  if (Platform.OS !== 'android' || !nativeCaptureModule?.discoverRecentSmsAccounts) {
    return emptySmsAccountDiscoveryResult('unsupported', 'SMS account discovery requires an Android development build.');
  }

  const days = Math.min(31, Math.max(1, Math.round(params?.days ?? 30)));
  const maxMessages = Math.min(300, Math.max(1, Math.round(params?.maxMessages ?? 300)));
  const rawResult = nativeCaptureModule.discoverRecentSmsAccounts(days, maxMessages);
  const parsed = (() => {
    try {
      return JSON.parse(rawResult) as {
        status?: NativeSmsAccountDiscoveryResult['status'];
        discoveredCount?: number;
        scannedCount?: number;
        ignoredCount?: number;
        accounts?: NativeCaptureSignal[];
        message?: string;
      };
    } catch {
      return {
        status: 'error' as const,
        message: 'The Android SMS account discovery response could not be parsed.',
      };
    }
  })();

  return {
    status: parsed.status ?? 'error',
    discoveredCount: parsed.discoveredCount ?? 0,
    scannedCount: parsed.scannedCount ?? 0,
    ignoredCount: parsed.ignoredCount ?? 0,
    message: parsed.message,
    signals: (parsed.accounts ?? [])
      .map(mapNativeAccountToCaptureSignal)
      .filter((signal): signal is CaptureSignalInput => Boolean(signal)),
  };
};

export const importRecentNativeSmsTransactions = async (params?: {
  days?: number;
  maxMessages?: number;
  approvedAccountIds?: string[];
}): Promise<NativeSmsImportResult> => {
  if (Platform.OS !== 'android' || !nativeCaptureModule?.importRecentSmsTransactions) {
    return emptySmsImportResult('unsupported', 'SMS inbox import requires an Android development build.');
  }

  const days = Math.min(31, Math.max(1, Math.round(params?.days ?? 30)));
  const maxMessages = Math.min(300, Math.max(1, Math.round(params?.maxMessages ?? 300)));
  const approvedAccountIdsJson = JSON.stringify(params?.approvedAccountIds ?? []);
  const rawResult = nativeCaptureModule.importRecentSmsTransactions(days, maxMessages, approvedAccountIdsJson);
  const parsed = (() => {
    try {
      return JSON.parse(rawResult) as {
        status?: NativeSmsImportResult['status'];
        importedCount?: number;
        scannedCount?: number;
        ignoredCount?: number;
        signals?: NativeCaptureSignal[];
        message?: string;
      };
    } catch {
      return {
        status: 'error' as const,
        message: 'The Android SMS import response could not be parsed.',
      };
    }
  })();

  return {
    status: parsed.status ?? 'error',
    importedCount: parsed.importedCount ?? 0,
    scannedCount: parsed.scannedCount ?? 0,
    ignoredCount: parsed.ignoredCount ?? 0,
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

  return nativeCaptureModule.openNotificationListenerSettings();
};

export const clearNativeCaptureQueue = async () => {
  if (!nativeCaptureModule?.clearPendingSignals) {
    return false;
  }

  return nativeCaptureModule.clearPendingSignals();
};

export const setNativeCaptureEnabled = async (enabled: boolean) => {
  if (!nativeCaptureModule?.setCaptureEnabled) {
    return false;
  }

  return nativeCaptureModule.setCaptureEnabled(enabled);
};

export const setNativeCaptureSourcesEnabled = async (params: {
  notificationEnabled: boolean;
  smsEnabled: boolean;
}) => {
  if (nativeCaptureModule?.setCaptureSourcesEnabled) {
    return nativeCaptureModule.setCaptureSourcesEnabled(params.notificationEnabled, params.smsEnabled);
  }

  return setNativeCaptureEnabled(params.notificationEnabled);
};

export const setNativeApprovedSmsAccounts = async (approvedAccountIds: string[]) => {
  if (!nativeCaptureModule?.setApprovedSmsAccounts) {
    return false;
  }

  return nativeCaptureModule.setApprovedSmsAccounts(JSON.stringify(approvedAccountIds));
};

export const subscribeToNativeCaptureSignals = (
  handler: (signal: CaptureSignalInput) => void
): NativeCaptureSubscription => {
  if (!nativeCaptureModule?.addListener) {
    return { remove: () => undefined };
  }

  const subscription = nativeCaptureModule.addListener('onNotificationSignal', (event) => {
    const signal = mapNativeSignalToCaptureSignal(event);
    if (signal) {
      handler(signal);
    }
  });
  nativeCaptureModule.startListening?.();

  return {
    remove: () => {
      subscription.remove();
      nativeCaptureModule.stopListening?.();
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
      smsAccountHint: event.smsAccountHint,
    },
  };
};

const mapNativeAccountToCaptureSignal = (event: NativeCaptureSignal): CaptureSignalInput | undefined => {
  const sender = event.sender?.trim();
  if (!sender) return undefined;

  return {
    source: 'sms',
    sender,
    body: 'Bank account approval preview',
    receivedAt: event.lastSeenAt,
    rawPayload: {
      captureOrigin: 'android_sms_account_discovery',
      rawBodyStored: 'false',
      smsAccountHint: event.smsAccountHint,
    },
  };
};
