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

type NativeNotificationSignal = {
  source?: 'notification';
  title?: string;
  body?: string;
  sourceApp?: string;
  receivedAt?: string;
  rawPackageName?: string;
};

type MoneyKaiNativeCaptureEvents = {
  onNotificationSignal: (event: NativeNotificationSignal) => void;
};

type MoneyKaiNativeCaptureModule = {
  startListening?: () => boolean;
  stopListening?: () => boolean;
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

export const subscribeToNativeCaptureSignals = (
  handler: (signal: CaptureSignalInput) => void
): NativeCaptureSubscription => {
  if (!nativeCaptureModule?.addListener) {
    return { remove: () => undefined };
  }

  const subscription = nativeCaptureModule.addListener('onNotificationSignal', (event) => {
    if (!event.body) return;
    handler({
      source: 'notification',
      title: event.title,
      body: event.body,
      sourceApp: event.sourceApp,
      receivedAt: event.receivedAt,
      rawPayload: {
        packageName: event.rawPackageName ?? event.sourceApp,
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
