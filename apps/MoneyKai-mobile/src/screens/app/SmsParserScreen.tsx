import React, { useRef, useState } from 'react';
import { Alert, Keyboard, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { AppText as Text } from '@/components/ui/AppText';
import { MoneyToolScreen, MoneyToolRow, toolStyles } from '@/components/ui/MoneyToolScreen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import { hasCurrentManualSmsConsent, MANUAL_SMS_DISCLOSURE } from '@/constants/smsConsent';
import { Disclosure } from '@/components/ui/Disclosure';
import { SmsAutomationControls } from '@/components/capture/SmsAutomationControls';
import { previewManualSms, type ManualSmsPreview } from '@/services/manualSmsPreview';
import { redactSensitiveSmsText } from '@/services/smsPrivacy';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { parseMoneyPaise, localDateKey } from '@/utils/purchaseTools';

export function SmsParserScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const monthlyBudget = useBudgetStore((s) => s.settings.monthly_allowance);
  const pendingCount = useCaptureStore((s) => s.drafts.filter((draft) => draft.user_id === userId && draft.status === 'pending').length);
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState<ManualSmsPreview | null>(null);
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState('');
  const [disclosure, setDisclosure] = useState(false);
  const saving = useRef(false);
  const [saved, setSaved] = useState(false);

  const parse = () => {
    Keyboard.dismiss();
    const next = previewManualSms(body);
    setBody(''); // Do not retain pasted SMS in a store, log or draft.
    setPreview(next);
    setAmount(next?.amount.toFixed(2) ?? '');
    setSaved(false);
    saving.current = false;
    setNotice(next ? 'Check the amount, date and category below. Nothing has been saved yet.' : 'No supported completed INR transaction found. The message was discarded. You can add a transaction manually.');
  };
  const save = (allowSimilar = false) => {
    if (saving.current || saved || !preview) return;
    if (!userId || useAuthStore.getState().user?.id !== userId) {
      Alert.alert('Sign in to save', 'Your session has changed. Sign in again before saving a transaction.');
      return;
    }
    if (useBudgetStore.getState().settings.monthly_allowance <= 0) {
      setNotice('Set your monthly budget first, then return here to confirm this transaction. Your review stays open.');
      return;
    }
    const paise = parseMoneyPaise(amount);
    const date = new Date(`${preview.transaction_date}T12:00:00`);
    if (!paise || !preview.description.trim() || !Number.isFinite(date.getTime()) || localDateKey(date) !== preview.transaction_date || preview.transaction_date > localDateKey(new Date())) {
      Alert.alert('Check transaction details', 'Enter a positive amount, description and valid date no later than today.');
      return;
    }
    saving.current = true;
    const similar = useTransactionStore.getState().transactions.some((t) => t.user_id === userId && t.type === preview.type && Math.round(t.amount * 100) === paise && t.transaction_date === preview.transaction_date && t.description.toLowerCase() === preview.description.trim().toLowerCase());
    if (similar && !allowSimilar) {
      Alert.alert('A similar transaction exists', 'The amount, date and description match a saved record. Is this another payment?', [
        { text: 'Cancel', style: 'cancel', onPress: () => { saving.current = false; } },
        { text: 'Save another payment', onPress: () => { saving.current = false; save(true); } },
      ], { cancelable: false });
      return;
    }
    const added = useTransactionStore.getState().addTransaction({ ...preview, user_id: userId, amount: paise / 100, description: redactSensitiveSmsText(preview.description.trim()) });
    setSaved(added);
    setNotice(added ? 'Transaction saved on this phone only. SMS-derived records are not cloud-synced or included in cloud backups.' : 'This transaction could not be added. Check for an existing record.');
    if (!added) saving.current = false;
  };
  return <MoneyToolScreen title="SMS parser" description="Find bank transactions in your messages. Review every draft before it becomes a saved expense or income.">
    <Button title={`Review drafts${pendingCount ? ` · ${pendingCount}` : ''}`} variant={pendingCount ? 'primary' : 'outline'} style={{ marginBottom: Spacing.md }} onPress={() => navigation.navigate('ReviewDrafts')} />
    <Disclosure title="Manual SMS parser" summary="Paste one message — no inbox access needed">
    <Disclosure title="How manual parsing works">
      <Text style={[toolStyles.body, { color: colors.textSecondary }]}>{MANUAL_SMS_DISCLOSURE}</Text>
    </Disclosure>
    <Input label="Paste a transaction SMS" value={body} onChangeText={setBody} multiline numberOfLines={5} maxLength={10000} autoCorrect={false} autoComplete="off" inputStyle={{ minHeight: 120 }} placeholder="Paste only the message you want to review" />
    <Button title="Review message" disabled={!body.trim()} onPress={() => hasCurrentManualSmsConsent(useCaptureStore.getState().settings, useAuthStore.getState().user?.id) ? parse() : setDisclosure(true)} />
    {notice ? <Text accessibilityLiveRegion="polite" style={[toolStyles.body, { color: colors.textSecondary, marginTop: Spacing.md }]}>{notice}</Text> : null}
    {notice && !preview ? <Button title="Add manually" variant="outline" onPress={() => navigation.navigate('App', { screen: 'Add' })} /> : null}
    {preview && !saved ? <View style={toolStyles.section}>
      <Text style={[toolStyles.title, { color: colors.textPrimary }]}>Review transaction · {preview.type === 'expense' ? 'Debit' : 'Credit'}</Text>
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}><Button title="Debit" variant={preview.type === 'expense' ? 'primary' : 'outline'} onPress={() => setPreview({ ...preview, type: 'expense', category: EXPENSE_CATEGORIES[0].id })} style={{ flex: 1 }} /><Button title="Credit" variant={preview.type === 'income' ? 'primary' : 'outline'} onPress={() => setPreview({ ...preview, type: 'income', category: INCOME_CATEGORIES[0].id })} style={{ flex: 1 }} /></View>
      <MoneyToolRow label="Payment method" value={preview.payment_method.toUpperCase()} />
      <Input label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Input label="Description" value={preview.description} maxLength={250} onChangeText={(description) => setPreview({ ...preview, description })} />
      <Input label="Date (YYYY-MM-DD)" value={preview.transaction_date} onChangeText={(transaction_date) => setPreview({ ...preview, transaction_date })} />
      <Text style={[toolStyles.body, { color: colors.textSecondary, marginBottom: Spacing.sm }]}>Category</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg }}>{(preview.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <Button key={c.id} title={c.name} size="sm" variant={preview.category === c.id ? 'primary' : 'outline'} onPress={() => setPreview({ ...preview, category: c.id })} />)}</View>
      {monthlyBudget <= 0 ? <View style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
        <Text style={[toolStyles.body, { color: colors.textSecondary }]}>Set a monthly budget before saving. Return here afterwards; your reviewed details will stay open.</Text>
        <Button title="Set monthly budget" variant="outline" onPress={() => navigation.navigate('Budget')} />
      </View> : null}
      <Button title="Confirm transaction" disabled={monthlyBudget <= 0 || !userId} onPress={() => save()} />
      <Button title="Discard" variant="ghost" onPress={() => { setPreview(null); setNotice('Draft discarded.'); }} />
    </View> : null}
    </Disclosure>
    <View style={toolStyles.section}><SmsAutomationControls showReviewAction={false} /></View>
    <Disclosure title="Privacy & terms">
      <Button title="Privacy policy" variant="ghost" onPress={() => navigation.navigate('Legal', { document: 'privacy' })} />
      <Button title="Terms & conditions" variant="ghost" onPress={() => navigation.navigate('Legal', { document: 'terms' })} />
    </Disclosure>
    <ModalSheet visible={disclosure} title="Process this message?" onClose={() => setDisclosure(false)} footer={<View style={{ gap: Spacing.sm }}><Button title="Agree and parse" onPress={() => { useCaptureStore.getState().acceptManualSmsDisclosure(); setDisclosure(false); parse(); }} /><Button title="Not now" variant="outline" onPress={() => setDisclosure(false)} /></View>}>
      <Text style={[toolStyles.body, { color: colors.textSecondary }]}>{MANUAL_SMS_DISCLOSURE}</Text>
    </ModalSheet>
  </MoneyToolScreen>;
}
