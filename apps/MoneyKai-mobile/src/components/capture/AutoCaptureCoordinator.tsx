import { useEffect } from 'react';
import { ingestCapturedTransactionSignal } from '@/services/autoCaptureService';
import { subscribeToNativeCaptureSignals } from '@/services/nativeCaptureBridge';
import { useCaptureStore } from '@/stores/useCaptureStore';

export function AutoCaptureCoordinator() {
  const autoCaptureEnabled = useCaptureStore((state) => state.settings.autoCaptureEnabled);

  useEffect(() => {
    if (!autoCaptureEnabled) {
      return undefined;
    }

    const subscription = subscribeToNativeCaptureSignals((signal) => {
      ingestCapturedTransactionSignal(signal);
    });

    return () => subscription.remove();
  }, [autoCaptureEnabled]);

  return null;
}
