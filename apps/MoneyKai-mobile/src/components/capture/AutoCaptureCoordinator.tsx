import { useEffect } from 'react';
import { isNativeSmsResearchBuildEnabled } from '@/config/environment';
import { ingestCapturedTransactionSignal } from '@/services/autoCaptureService';
import {
  setNativeApprovedSmsAccounts,
  setNativeCaptureSourcesEnabled,
  subscribeToNativeCaptureSignals,
} from '@/services/nativeCaptureBridge';
import { useCaptureStore } from '@/stores/useCaptureStore';

export function AutoCaptureCoordinator() {
  const autoCaptureEnabled = useCaptureStore((state) => state.settings.autoCaptureEnabled);
  const notificationCaptureEnabled = useCaptureStore((state) => state.settings.notificationCaptureEnabled);
  const smsResearchModeEnabled = useCaptureStore((state) => state.settings.smsResearchModeEnabled);
  const approvedSmsAccountIds = useCaptureStore((state) =>
    state.monitoredAccounts
      .filter((account) => account.status === 'approved')
      .map((account) => account.id)
      .sort()
      .join('|')
  );

  useEffect(() => {
    void setNativeApprovedSmsAccounts(approvedSmsAccountIds ? approvedSmsAccountIds.split('|') : []);
  }, [approvedSmsAccountIds]);

  useEffect(() => {
    const smsEnabled = isNativeSmsResearchBuildEnabled() && smsResearchModeEnabled;
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
