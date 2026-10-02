import React, { useState } from 'react';
import { AccessibilityInfo, Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import { Input } from '@/components/ui/Input';
import { MoneyToolScreen, toolStyles } from '@/components/ui/MoneyToolScreen';
import { PurchaseImpactReport } from '@/components/money/PurchaseImpactReport';
import { buildPurchaseImpact, DEFAULT_REDUCIBLE_CATEGORIES, type PurchaseImpact } from '@/utils/purchaseImpact';
import { parseGraphDate } from '@/utils/graphPeriods';
import { getCategoryById } from '@/constants/categories';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { isFirebaseConfigured } from '@/services/firebase';
import { buildMonthlyBudgetOverview } from '@/utils/spendingRunway';
import { formatToolMoney, parseMoneyPaise, purchaseExpenseAmounts } from '@/utils/purchaseTools';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';

export function BeforeYouBuyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<NativeStackScreenProps<RootStackParamList, 'BeforeYouBuy'>['route']>();
  const { colors } = useTheme();
  const ownerId = useAuthStore((s) => s.user?.id);
  const allowance = useBudgetStore((s) => s.settings.monthly_allowance);
  const transactions = useTransactionStore((s) => s.transactions);
  const [price, setPrice] = useState(route.params?.pricePaise ? String(route.params.pricePaise / 100) : '');
  const [mode, setMode] = useState<'buy' | 'reserve'>('buy');
  const [flexible, setFlexible] = useState(DEFAULT_REDUCIBLE_CATEGORIES);
  const [checked, setChecked] = useState<{ result: PurchaseImpact; transactions: typeof transactions; allowance: number; ownerId?: string; day: string } | null>(null);
  const [error, setError] = useState('');
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const day = `${month}-${String(now.getDate()).padStart(2, '0')}`;
  const records = transactions.filter(row => {
    const date = parseGraphDate(row.transaction_date);
    return date && date <= now && Number.isSafeInteger(Math.round(row.amount * 100)) && row.amount > 0;
  });
  const expenses = purchaseExpenseAmounts(records, ownerId, month, !isFirebaseConfigured());
  const overview = buildMonthlyBudgetOverview(allowance, expenses, now);
  const remaining = overview.remainingPaise - overview.overBudgetPaise;
  const pricePaise = parseMoneyPaise(price);
  const result = checked?.transactions === transactions && checked.allowance === allowance && checked.ownerId === ownerId && checked.day === day ? checked.result : null;
  const reset = () => { setChecked(null); setError(''); };

  return <MoneyToolScreen title="Before You Buy">
    <View style={[styles.budget, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
      <AppIcon name="wallet-outline" color={colors.textPrimary} size={24} />
      <View style={{ flex: 1 }}><Text style={[toolStyles.body, { color: colors.textSecondary }]}>Remaining monthly budget</Text>
        <Text style={[styles.money, { color: colors.textPrimary }]}>{formatToolMoney(remaining)}</Text>
        <Text style={[toolStyles.body, { color: colors.textSecondary }]}>{overview.daysRemaining} days left · not your bank balance</Text></View>
    </View>
    {overview.state === 'no-budget' ? <>
      <Text style={[toolStyles.body, { color: colors.textSecondary, marginBottom: Spacing.md }]}>Set your monthly budget first. We’ll compare the price with your recorded spending.</Text>
      <Button title="Set monthly budget" onPress={() => navigation.navigate('Budget')} />
    </> : <>
      <Text accessibilityRole="header" style={[toolStyles.title, { color: colors.textPrimary }]}>What are you planning?</Text>
      {(['buy', 'reserve'] as const).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={value === 'buy' ? 'Buy something' : 'Set money aside'} accessibilityState={{ checked: mode === value }}
        onPress={() => { setMode(value); reset(); }} style={[styles.choice, { borderColor: mode === value ? colors.textPrimary : colors.borderLight }]}>
        <Text style={[toolStyles.body, { color: colors.textPrimary }]}>{mode === value ? '● ' : '○ '}{value === 'buy' ? 'Buy something' : 'Set money aside'}</Text>
      </Pressable>)}
      <Input label={mode === 'buy' ? 'Purchase amount' : 'Amount to set aside'} value={price} onChangeText={value => { setPrice(value); reset(); }} keyboardType="decimal-pad" prefix="₹" placeholder="e.g. 2000" error={error} maxLength={16} />
      <Disclosure title="Flexible spending">
        <Text style={[toolStyles.body, { color: colors.textSecondary }]}>Choose only spending you can reduce—not essentials.</Text>
        {['entertainment', 'electronics', 'food', 'shopping'].map(id => <Pressable key={id} accessibilityRole="checkbox" accessibilityLabel={getCategoryById(id)?.name} accessibilityState={{ checked: flexible.includes(id) }}
          onPress={() => { setFlexible(list => list.includes(id) ? list.filter(item => item !== id) : [...list, id]); reset(); }} style={styles.checkbox}>
          <Text style={[toolStyles.body, { color: colors.textPrimary }]}>{flexible.includes(id) ? '☑ ' : '☐ '}{getCategoryById(id)?.name}</Text>
        </Pressable>)}
      </Disclosure>
      <Button title="Check month impact" accessibilityHint="Shows a report below. Scroll down to read the details." style={{ marginTop: Spacing.lg }} onPress={() => {
        Keyboard.dismiss();
        if (pricePaise === null || pricePaise <= 0) { setError('Enter an amount above zero.'); return; }
        const impact = buildPurchaseImpact({ remainingPaise: remaining, amountPaise: pricePaise, commitmentsPaise: 0,
          days: overview.daysRemaining, now, ownerId, records, includePreviewSamples: !isFirebaseConfigured(), reducibleCategories: flexible });
        if (!impact) { setError('Check your budget and amounts, then try again.'); return; }
        setError(''); setChecked({ result: impact, transactions, allowance, ownerId, day });
        AccessibilityInfo.announceForAccessibility(`Report ready below. Daily spending room: ${formatToolMoney(impact.dailyAfterPaise)}. Scroll down for details.`);
      }} />
    </>}
    {result ? <PurchaseImpactReport result={result} mode={mode} /> : null}
    {checked && !result ? <Text style={[toolStyles.body, { color: colors.textSecondary }]}>Your records, budget or date changed. Check again for a fresh report.</Text> : null}
    <Disclosure title="About this estimate">
      <Text style={[toolStyles.body, { color: colors.textSecondary }]}>{'• Uses your recorded budget, not your bank balance.\n• Excludes unrecorded costs and future income.\n• Runs on-device; no AI upload.\n• Saves no expense or transfer. This is an estimate, not advice to buy.'}</Text>
    </Disclosure>
  </MoneyToolScreen>;
}
const styles = StyleSheet.create({
  budget: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.xl },
  money: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl, marginTop: Spacing.xs },
  choice: { borderWidth: 1, borderRadius: BorderRadius.md, minHeight: 48, padding: Spacing.md, marginBottom: Spacing.md },
  checkbox: { minHeight: 48, paddingVertical: Spacing.md },
});
