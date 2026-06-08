import { Platform } from 'react-native';
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

export const getNativeCaptureStatus = async (): Promise<NativeCaptureStatus> => ({
  platform: Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web' ? Platform.OS : 'unknown',
  notificationAccess: Platform.OS === 'android' ? 'not_requested' : 'unsupported',
  smsAccess: 'unsupported',
  nativeModuleAvailable: false,
});

export const openNativeCaptureSettings = async () => false;

export const subscribeToNativeCaptureSignals = (
  _handler: (signal: CaptureSignalInput) => void
): NativeCaptureSubscription => ({
  remove: () => undefined,
});
