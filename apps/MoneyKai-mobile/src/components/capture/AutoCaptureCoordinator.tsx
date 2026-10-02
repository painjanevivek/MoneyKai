import { useEffect } from 'react';
import { isNativeSmsResearchBuildEnabled, isNotificationCaptureEnabled } from '@/config/environment';
import { ingestNativeCaptureSignal } from '@/services/autoCaptureService';
import { ingestLedgerNotification } from '@/services/ledgerNotificationCapture';
import {
  setNativeApprovedSmsAccounts,
  configureNativeSmsSchedule,
  setNativeCaptureSourcesEnabled,
  subscribeToNativeCaptureSignals,
  mapNativeSignalToCaptureSignal,
  setPaymentNotificationPackages,
} from '@/services/nativeCaptureBridge';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { hasCurrentSmsConsent } from '@/constants/smsConsent';
import { normalizeSmsInterval } from '@/constants/smsSchedule';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useConnectStore } from '@/stores/useConnectStore';
import { PAYMENT_CONNECTIONS } from '@/constants/paymentConnections';
import { LARGE_SMS_LOCAL_ENABLED, APPROVED_SMS_CLOUD_ENABLED } from '@/config/largeSmsFeatures';
import { syncApprovedSmsOnce } from '@/services/approvedSmsSync';
import { downloadApprovedSmsOnce } from '@/services/approvedSmsDownloads';
import { useLocalLedgerStore } from '@/stores/useLocalLedgerStore';
import { ledgerRequest } from '@/services/localLedger';

export function AutoCaptureCoordinator() {
  const userId = useAuthStore((s) => s.user?.id);
  useEffect(() => {
    if (LARGE_SMS_LOCAL_ENABLED || APPROVED_SMS_CLOUD_ENABLED) void useLocalLedgerStore.getState().initialize(userId ?? '').then(() => {
      if(userId && useLocalLedgerStore.getState().ready && useAuthStore.getState().user?.id === userId) return ledgerRequest(userId,{op:'features',enabled:LARGE_SMS_LOCAL_ENABLED});
    });
  }, [userId]);
  useEffect(() => {
    if(!APPROVED_SMS_CLOUD_ENABLED || !userId) return;
    let stopped=false; let running=false; let nextAt=0;
    const run=async () => {
      if(stopped || running || Date.now()<nextAt || !useLocalLedgerStore.getState().ready) return;
      running=true;
      try {
        const status=await syncApprovedSmsOnce(userId);
        nextAt=status.retryAt || Date.now()+20000;
        if(!stopped && !['paused_free_quota','paused_storage','coordination_unavailable','disabled_unverified'].includes(status.paused ?? '')) await downloadApprovedSmsOnce(userId);
      } catch { nextAt=Date.now()+60000; } finally { running=false; }
    };
    void run(); const interval=setInterval(()=>void run(),20000);
    return () => { stopped=true; clearInterval(interval); };
  },[userId]);
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

  useEffect(()=>{
    if(!LARGE_SMS_LOCAL_ENABLED || !userId || !autoCaptureEnabled || !notificationCaptureEnabled || budget<=0)return;
    let stopped=false,running=false;
    const drain=async()=>{
      if(stopped || running || !useLocalLedgerStore.getState().ready)return;running=true;
      try {
        const {events}=await ledgerRequest<{events:Parameters<typeof mapNativeSignalToCaptureSignal>[0][]}>(userId,{op:'captureEvents'});
        for(const event of events) {
          if(stopped || useAuthStore.getState().user?.id!==userId)return;
          const signal=mapNativeSignalToCaptureSignal(event);
          if(signal)await ingestLedgerNotification(signal);
        }
      } catch {useLocalLedgerStore.setState({error:'Notification processing is paused. Saved events will retry.'});}
      finally{running=false;}
    };
    void drain();const timer=setInterval(()=>void drain(),5000);
    return()=>{stopped=true;clearInterval(timer);};
  },[userId,autoCaptureEnabled,notificationCaptureEnabled,budget,selectedPackages]);

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
      if(LARGE_SMS_LOCAL_ENABLED) {
        if(signal.source==='notification') void ingestLedgerNotification(signal).catch(()=>useLocalLedgerStore.setState({error:'A notification could not be saved. Reopen Capture to retry.'}));
      } else ingestNativeCaptureSignal(signal);
    });

    return () => {
      subscription.remove();
      void setNativeCaptureSourcesEnabled({ notificationEnabled: false, smsEnabled: false });
    };
  }, [autoCaptureEnabled, notificationCaptureEnabled, smsResearchModeEnabled, smsConsentValid, budget, userId, selectedPackages]);

  return null;
}
