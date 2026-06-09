import { useEffect } from 'react';
import { isSmsResearchBuildEnabled } from '@/config/environment';
import { ingestCapturedTransactionSignal } from '@/services/autoCaptureService';
import { setNativeCaptureSourcesEnabled, subscribeToNativeCaptureSignals } from '@/services/nativeCaptureBridge';
import { useCaptureStore } from '@/stores/useCaptureStore';

export function AutoCaptureCoordinator() {
  const autoCaptureEnabled = useCaptureStore((state) => state.settings.autoCaptureEnabled);
  const notificationCaptureEnabled = useCaptureStore((state) => state.settings.notificationCaptureEnabled);
  const smsResearchModeEnabled = useCaptureStore((state) => state.settings.smsResearchModeEnabled);

  useEffect(() => {
    const smsEnabled = isSmsResearchBuildEnabled() && smsResearchModeEnabled;
    const notificationEnabled = notificationCaptureEnabled;

    if (!autoCaptureEnabled || (!notificationEnabled && !smsEnabled)) {
      void setNativeCaptureSourcesEnabled({ notificationEnabled: false, smsEnabled: false });
      return undefined;
    }

    void setNativeCaptureSourcesEnabled({ notificationEnabled, smsEnabled });
    const subscription = subscribeToNativeCaptureSignals((signal) => {
      ingestCapturedTransactionSignal(signal);
    });

    return () => {
      subscription.remove();
      void setNativeCaptureSourcesEnabled({ notificationEnabled: false, smsEnabled: false });
    };
  }, [autoCaptureEnabled, notificationCaptureEnabled, smsResearchModeEnabled]);

  return null;
}
