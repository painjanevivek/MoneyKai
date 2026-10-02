import { useEffect } from 'react';
import { isNativeSmsResearchBuildEnabled, isNotificationCaptureEnabled } from '@/config/environment';
import { ingestNativeCaptureSignal } from '@/services/autoCaptureService';
import {
  setNativeApprovedSmsAccounts,
  configureNativeSmsSchedule,
  setNativeCaptureSourcesEnabled,
  subscribeToNativeCaptureSignals,
  setPaymentNotificationPackages,
} from '@/services/nativeCaptureBridge';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { hasCurrentSmsConsent } from '@/constants/smsConsent';
import { normalizeSmsInterval } from '@/constants/smsSchedule';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useConnectStore } from '@/stores/useConnectStore';
import { PAYMENT_CONNECTIONS } from '@/constants/paymentConnections';

export function AutoCaptureCoordinator() {
  const userId = useAuthStore((s) => s.user?.id);
  const selectedPackages = useConnectStore((state) => PAYMENT_CONNECTIONS
    .filter((app) => userId && state.notificationAppsByUser[userId]?.[app.id])
    .map((app) => app.packageName).join('|'));
  const budget = useBudgetStore((s) => s.settings.monthly_allowance);
  const interval = useCaptureStore((s) => normalizeSmsInterval(s.settings.smsParseIntervalMinutes));
  const smsConsentValid = useCaptureStore((s) => hasCurrentSmsConsent(s.settings, userId));
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
    void setPaymentNotificationPackages(selectedPackages ? selectedPackages.split('|') : [], userId ?? '');
  }, [selectedPackages, userId]);

  useEffect(() => {
    void setNativeApprovedSmsAccounts(approvedSmsAccountIds ? approvedSmsAccountIds.split('|') : []);
  }, [approvedSmsAccountIds]);

  useEffect(() => {
    const enabled = isNativeSmsResearchBuildEnabled() && autoCaptureEnabled && smsResearchModeEnabled && smsConsentValid && budget > 0;
    void configureNativeSmsSchedule(enabled, interval, userId ?? '');
  }, [autoCaptureEnabled, smsResearchModeEnabled, smsConsentValid, interval, userId, budget]);

  useEffect(() => {
    const smsEnabled = isNativeSmsResearchBuildEnabled() && smsResearchModeEnabled && smsConsentValid && budget > 0;
    const notificationEnabled = isNotificationCaptureEnabled() && notificationCaptureEnabled && Boolean(userId) && budget > 0 && Boolean(selectedPackages);

    if (!autoCaptureEnabled || (!notificationEnabled && !smsEnabled)) {
      void setNativeCaptureSourcesEnabled({ notificationEnabled: false, smsEnabled: false });
      return undefined;
    }

    void setNativeCaptureSourcesEnabled({ notificationEnabled, smsEnabled });
    const subscription = subscribeToNativeCaptureSignals((signal) => {
      if (signal.source === 'notification') {
        const packageName = signal.rawPayload?.rawPackageName;
        if (typeof packageName !== 'string' || !selectedPackages.split('|').includes(packageName)) return;
      }
      ingestNativeCaptureSignal(signal);
    });

    return () => {
      subscription.remove();
      void setNativeCaptureSourcesEnabled({ notificationEnabled: false, smsEnabled: false });
    };
  }, [autoCaptureEnabled, notificationCaptureEnabled, smsResearchModeEnabled, smsConsentValid, budget, userId, selectedPackages]);

  return null;
}
