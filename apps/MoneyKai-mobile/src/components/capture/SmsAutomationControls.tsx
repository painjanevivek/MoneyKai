import React, { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { AppText as Text } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { toolStyles } from '@/components/ui/MoneyToolScreen';
import { useTheme } from '@/hooks/useTheme';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { hasCurrentSmsConsent, SMS_DISCLOSURE, SMS_AUTO_ADD_DISCLOSURE, hasCurrentSmsAutoAddConsent } from '@/constants/smsConsent';
import { SMS_PARSE_INTERVALS, normalizeSmsInterval } from '@/constants/smsSchedule';
import { isNativeSmsResearchBuildEnabled } from '@/config/environment';
import { getNativeCaptureStatus } from '@/services/nativeCaptureBridge';
import { startSmsParsing, turnOffSmsAutomation, turnOnSmsAutomation, updateSmsAutomationInterval } from '@/services/smsAutomation';
import { Spacing } from '@/constants/theme';
import type { SmsImportProgress } from '@/types/smsImport';
import type { SmsScanResult } from '@/services/smsAutomation';
import { getSmsImportRangeOption } from '@/constants/smsImportRanges';

export function SmsAutomationControls({ onNavigate, showReviewAction = true }: { onNavigate?: (screen: 'AutoCapture' | 'ReviewDrafts' | 'Budget') => void; showReviewAction?: boolean }) {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const open = (screen: 'AutoCapture' | 'ReviewDrafts' | 'Budget') => onNavigate ? onNavigate(screen) : navigation.navigate(screen);
  const settings = useCaptureStore((s) => s.settings);
  const owner = useAuthStore((s) => s.user?.id);
  const draftCount = useCaptureStore((s) => s.drafts.filter((draft) => draft.user_id === owner && draft.status === 'pending').length);
  const budget = useBudgetStore((s) => s.settings.monthly_allowance);
  const history = getSmsImportRangeOption(settings.smsImportRangeId);
  const supported = isNativeSmsResearchBuildEnabled();
  const enabled = supported && settings.autoCaptureEnabled && settings.smsResearchModeEnabled && hasCurrentSmsConsent(settings, owner);
  const [busy, setBusy] = useState(false);
  const [disclosure, setDisclosure] = useState(false);
  const [autoAddDisclosure, setAutoAddDisclosure] = useState(false);
  const autoAddEnabled = hasCurrentSmsAutoAddConsent(settings, owner);
  const [notice, setNotice] = useState('');
  const [needsAccountApproval, setNeedsAccountApproval] = useState(false);
  const [progress, setProgress] = useState<SmsImportProgress>();
  const mounted = useRef(true);
  const locked = useRef(false);
  const onProgress = (next: SmsImportProgress) => { if (mounted.current) setProgress(next); };
  const onResult = (result: SmsScanResult) => {
    if (!mounted.current) return;
    setNeedsAccountApproval(result.needsAccountApproval);
    setProgress(undefined);
  };
  useEffect(() => {
    mounted.current = true;
    const refresh = async () => {
      const status = await getNativeCaptureStatus();
      if (!mounted.current) return;
      useCaptureStore.getState().setSmsAccessStatus(status.smsInboxAccess ?? status.smsAccess);
      if (status.smsInboxAccess !== 'granted' && enabled) {
        await turnOffSmsAutomation();
        if (mounted.current) setNotice('SMS access is unavailable. Automatic reading is off.');
      }
    };
    void refresh();
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') void refresh(); });
    return () => { mounted.current = false; listener.remove(); };
  }, [enabled]);
  const run = async (action: () => Promise<string>) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setProgress(undefined); setNotice('');
    try { const message = await action(); if (mounted.current) setNotice(message); }
    catch { if (mounted.current) setNotice('Could not complete the SMS operation. Try again.'); }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  };
  return <View>
    {showReviewAction ? <Button title={`Review drafts${draftCount ? ` · ${draftCount}` : ''}`} variant={draftCount ? 'primary' : 'outline'} style={{ marginBottom: Spacing.xl }} onPress={() => open('ReviewDrafts')} /> : null}
    <Text style={[toolStyles.title, { color: colors.textPrimary }]}>Automatic SMS reading</Text>
    <Text style={[toolStyles.body, { color: colors.textSecondary, marginBottom: Spacing.md }]}>{enabled ? 'On · Scheduled checks; Android may delay them to save battery' : 'Off · No scheduled SMS checks'}</Text>
    <Text style={[toolStyles.body, { color: colors.textSecondary, marginBottom: Spacing.md }]}>Turn On checks {history.label === 'ALL' ? 'all available history' : `the last ${history.label}`} now, up to {history.maxMessages.toLocaleString()} SMS. Change the history range in Bank accounts & import settings.</Text>
    {!enabled ? <Text style={[toolStyles.body, { color: colors.textSecondary, marginBottom: Spacing.md }]}>{!supported
      ? 'Automatic reading is unavailable in this build. Paste a message in the manual parser instead.'
      : budget <= 0 ? 'Set a monthly budget before turning on automatic reading.'
        : settings.smsAccessStatus === 'granted' ? 'SMS access is available. Turn on reading to check messages and create drafts for your review.'
          : 'Requires Android SMS permission. You will review the disclosure before choosing whether to allow access.'}</Text> : null}
      {!enabled ? <Button title="Turn On" variant="outline" disabled={busy || !supported || budget <= 0} onPress={() => {
        if (!supported) { setNotice('Automatic reading needs the internal SMS-enabled build. You can still use manual parsing.'); return; }
        if (budget <= 0) { setNotice('Set a monthly budget first, then turn on automatic reading.'); return; }
        if (hasCurrentSmsConsent(useCaptureStore.getState().settings, useAuthStore.getState().user?.id)) {
          void run(() => turnOnSmsAutomation(false, { onProgress, onResult }));
          return;
        }
        setDisclosure(true);
      }} /> : <Button title="Turn Off" variant="outline" onPress={() => { setDisclosure(false); void turnOffSmsAutomation().then((message) => { if (mounted.current) setNotice(message); }); }} />}
    {enabled ? <>
    <Disclosure title="Recognized transactions" summary={autoAddEnabled ? 'Auto-add on · uncertain messages need review' : 'Review all · auto-add is off'}>
      <Text style={[toolStyles.body, { color: colors.textSecondary }]}>Food, Medical and other recognized categories are suggested offline. Your confirmations teach exact counterparties. Person transfers keep the person's name; MoneyKai does not guess what the transfer purchased.</Text>
      <Button title={autoAddEnabled ? 'Turn auto-add off' : 'Enable auto-add'} variant="outline" disabled={busy} style={{ marginTop: Spacing.md }} onPress={() => autoAddEnabled ? useCaptureStore.getState().setAutoAddRecognizedSms(false) : setAutoAddDisclosure(true)} />
    </Disclosure>
    <Disclosure title="Check frequency" summary={`Every ${SMS_PARSE_INTERVALS.find((option) => option.minutes === normalizeSmsInterval(settings.smsParseIntervalMinutes))?.label.toLowerCase()}`}>
      <View style={styles.intervals}>{SMS_PARSE_INTERVALS.map((option) => <Button key={option.minutes} title={option.label} size="sm" variant={normalizeSmsInterval(settings.smsParseIntervalMinutes) === option.minutes ? 'primary' : 'outline'} disabled={busy} onPress={() => void run(() => updateSmsAutomationInterval(option.minutes))} style={styles.interval} />)}</View>
    </Disclosure>
    <Button title={busy ? 'Checking…' : 'Check messages now'} variant={draftCount ? 'outline' : 'primary'} loading={busy} disabled={busy} style={{ marginTop: Spacing.lg }} onPress={() => void run(async () => {
      const result = await startSmsParsing(onProgress);
      onResult(result);
      return result.message;
    })} />
    </> : null}
    {busy && progress ? <Text accessibilityLiveRegion="polite" style={[toolStyles.body, { color: colors.textSecondary, marginTop: Spacing.md }]}>{progress.message}{'\n'}{progress.scannedCount} inbox messages checked · {progress.draftedCount} drafts · {progress.duplicateCount} duplicates</Text> : null}
    {notice ? <Text accessibilityLiveRegion="polite" style={[toolStyles.body, { color: colors.textSecondary, marginTop: Spacing.md }]}>{notice}</Text> : null}
    {budget <= 0 ? <Button title="Set monthly budget" variant="ghost" onPress={() => open('Budget')} /> : null}
    {needsAccountApproval ? <Button title="Choose bank accounts" variant="outline" style={{ marginTop: Spacing.md }} onPress={() => open('AutoCapture')} /> : null}
    <Disclosure title="How automatic reading works" summary="Timing, privacy, and what gets saved">
      <Text style={[toolStyles.body, { color: colors.textSecondary }]}>{SMS_DISCLOSURE}</Text>
      {!supported ? <Text style={[toolStyles.body, { color: colors.textSecondary, marginTop: Spacing.sm }]}>This build has no inbox access. Public SMS-enabled releases require Google Play’s permission review; an internal testing build is not approval.</Text> : null}
      <Button title="Bank accounts & import settings" variant="ghost" onPress={() => open('AutoCapture')} />
    </Disclosure>
    <ModalSheet visible={disclosure} title="Allow automatic SMS reading?" onClose={() => setDisclosure(false)} footer={<View style={{ gap: Spacing.sm }}>
      <Button title="Agree and continue" onPress={() => { setDisclosure(false); void run(() => turnOnSmsAutomation(true, { onProgress, onResult })); }} />
      <Button title="Not now" variant="outline" onPress={() => setDisclosure(false)} />
    </View>}><Text style={[toolStyles.body, { color: colors.textSecondary }]}>{SMS_DISCLOSURE}</Text></ModalSheet>
    <ModalSheet visible={autoAddDisclosure} title="Auto-add recognized transactions?" onClose={() => setAutoAddDisclosure(false)} footer={<View style={{ gap: Spacing.sm }}>
      <Button title="Agree and enable auto-add" onPress={() => { useCaptureStore.getState().setAutoAddRecognizedSms(true); setAutoAddDisclosure(false); setNotice('Auto-add enabled for newly captured, reliably categorized transactions. Existing review drafts are unchanged.'); }} />
      <Button title="Keep reviewing all" variant="outline" onPress={() => setAutoAddDisclosure(false)} />
    </View>}><Text style={[toolStyles.body, { color: colors.textSecondary }]}>{SMS_AUTO_ADD_DISCLOSURE}</Text></ModalSheet>
  </View>;
}
const styles = StyleSheet.create({
  intervals: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }, interval: { flexGrow: 1, flexBasis: '30%' },
});
