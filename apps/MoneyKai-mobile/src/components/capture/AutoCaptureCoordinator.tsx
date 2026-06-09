import { useEffect } from 'react';
import { ingestCapturedTransactionSignal } from '@/services/autoCaptureService';
import { setNativeCaptureEnabled, subscribeToNativeCaptureSignals } from '@/services/nativeCaptureBridge';
import { useCaptureStore } from '@/stores/useCaptureStore';

export function AutoCaptureCoordinator() {
  const autoCaptureEnabled = useCaptureStore((state) => state.settings.autoCaptureEnabled);
  const notificationCaptureEnabled = useCaptureStore((state) => state.settings.notificationCaptureEnabled);

  useEffect(() => {
    if (!autoCaptureEnabled || !notificationCaptureEnabled) {
      void setNativeCaptureEnabled(false);
      return undefined;
    }

    void setNativeCaptureEnabled(true);
    const subscription = subscribeToNativeCaptureSignals((signal) => {
      ingestCapturedTransactionSignal(signal);
    });

    return () => {
      subscription.remove();
      void setNativeCaptureEnabled(false);
    };
  }, [autoCaptureEnabled, notificationCaptureEnabled]);

  return null;
}
