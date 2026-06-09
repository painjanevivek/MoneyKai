import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import type { CaptureSignalInput } from '@/types/capture';

export type NativeCapturePermissionStatus = 'unsupported' | 'not_requested' | 'granted' | 'denied';

export interface NativeCaptureStatus {
  platform: 'android' | 'ios' | 'web' | 'unknown';
  notificationAccess: NativeCapturePermissionStatus;
  smsAccess: NativeCapturePermissionStatus;
  nativeModuleAvailable: boolean;
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
  getStatus?: () => NativeCaptureStatus;
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
  nativeModuleAvailable: false,
};

export const getNativeCaptureStatus = async (): Promise<NativeCaptureStatus> => {
  if (!nativeCaptureModule?.getStatus) {
    return fallbackStatus;
  }

  return nativeCaptureModule.getStatus();
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

export const subscribeToNativeCaptureSignals = (
  handler: (signal: CaptureSignalInput) => void
): NativeCaptureSubscription => {
  if (!nativeCaptureModule?.addListener) {
    return { remove: () => undefined };
  }

  const subscription = nativeCaptureModule.addListener('onNotificationSignal', (event) => {
    const source = event.source === 'sms' ? 'sms' : 'notification';
    const body =
      event.body?.trim() ||
      (source === 'notification' && event.privacyStatus === 'content_hidden'
        ? 'Notification content hidden by Android privacy settings'
        : '');

    if (!body) return;

    handler({
      source,
      title: event.title,
      body,
      sourceApp: event.sourceApp,
      sender: event.sender,
      receivedAt: event.receivedAt,
      rawPayload: {
        rawPackageName: event.rawPackageName,
        privacyStatus: event.privacyStatus,
      },
    });
  });
  nativeCaptureModule.startListening?.();

  return {
    remove: () => {
      subscription.remove();
      nativeCaptureModule.stopListening?.();
    },
  };
};
