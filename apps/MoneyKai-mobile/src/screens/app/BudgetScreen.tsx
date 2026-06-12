import React, { useState } from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import { createAppScreenStyles } from './screenStyles';

export function BudgetScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const settings = useBudgetStore((state) => state.settings);
  const isEmergencyMode = useBudgetStore((state) => state.isEmergencyMode);
  const adjustments = useBudgetStore((state) => state.adjustments);
  const updateSettings = useBudgetStore((state) => state.updateSettings);
  const addAdjustment = useBudgetStore((state) => state.addAdjustment);
  const toggleEmergencyMode = useBudgetStore((state) => state.toggleEmergencyMode);
  const transactions = useTransactionStore((state) => state.transactions);
  const [allowance, setAllowance] = useState(String(settings.monthly_allowance || ''));
  const [resetDay, setResetDay] = useState(String(settings.reset_day || 1));
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const spent = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const remaining = Math.max(settings.monthly_allowance - spent, 0);
  const formatMoney = (value: number) => `${currencySymbol}${value.toLocaleString('en-IN')}`;

  const saveBudget = () => {
    const nextAllowance = Number(allowance);
    const nextResetDay = Number(resetDay);
    if (!Number.isFinite(nextAllowance) || nextAllowance < 0) {
      Alert.alert('Invalid budget', 'Enter a valid monthly allowance.');
      return;
    }
    if (!Number.isInteger(nextResetDay) || nextResetDay < 1 || nextResetDay > 31) {
      Alert.alert('Invalid reset day', 'Reset day must be between 1 and 31.');
      return;
    }

    updateSettings({
      monthly_allowance: nextAllowance,
      reset_day: nextResetDay,
      currency: settings.currency,
    });
    Alert.alert('Budget saved', 'Your budget settings were saved and synced.');
  };

  const saveAdjustment = (type: 'add' | 'subtract') => {
    const numericAmount = Number(adjustmentAmount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert('Invalid adjustment', 'Enter an amount greater than zero.');
      return;
    }

    addAdjustment({
      amount: numericAmount,
      type,
      reason: adjustmentReason.trim() || 'Manual adjustment',
      date: new Date().toISOString(),
    });
    setAllowance(String(type === 'add' ? settings.monthly_allowance + numericAmount : settings.monthly_allowance - numericAmount));
    setAdjustmentAmount('');
    setAdjustmentReason('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Budget</Text>
          <Text style={styles.title}>Monthly guardrails</Text>
          <Text style={styles.subtitle}>Set your allowance and track how much room is left this cycle.</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.row}>
            <View>
              <Text style={styles.muted}>Remaining</Text>
              <Text style={styles.value}>{formatMoney(remaining)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.muted}>Spent</Text>
              <Text style={styles.value}>{formatMoney(spent)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.muted}>Allowance: {formatMoney(settings.monthly_allowance)}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Budget settings</Text>
          <Input
            label="Monthly allowance"
            value={allowance}
            onChangeText={setAllowance}
            placeholder="25000"
            keyboardType="decimal-pad"
            inputMode="decimal"
            icon="wallet-outline"
          />
          <Input
            label="Reset day"
            value={resetDay}
            onChangeText={setResetDay}
            placeholder="1"
            keyboardType="number-pad"
            icon="calendar-refresh"
          />
          <View style={[styles.row, { marginBottom: Spacing.md }]}>
            <Text style={styles.muted}>Auto reset monthly</Text>
            <Switch
              value={settings.auto_reset}
              onValueChange={(auto_reset) => updateSettings({ auto_reset })}
              trackColor={{ false: colors.border, true: colors.primaryBg }}
              thumbColor={settings.auto_reset ? colors.primary : colors.textTertiary}
            />
          </View>
          <View style={[styles.row, { marginBottom: Spacing.md }]}>
            <Text style={styles.muted}>Carry forward unused balance</Text>
            <Switch
              value={settings.carry_forward}
              onValueChange={(carry_forward) => updateSettings({ carry_forward })}
              trackColor={{ false: colors.border, true: colors.primaryBg }}
              thumbColor={settings.carry_forward ? colors.primary : colors.textTertiary}
            />
          </View>
          <View style={[styles.row, { marginBottom: Spacing.md }]}>
            <Text style={styles.muted}>Emergency mode</Text>
            <Switch
              value={isEmergencyMode}
              onValueChange={toggleEmergencyMode}
              trackColor={{ false: colors.border, true: colors.primaryBg }}
              thumbColor={isEmergencyMode ? colors.primary : colors.textTertiary}
            />
          </View>
          <Button title="Save Budget" onPress={saveBudget} icon="content-save-outline" />
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Manual adjustment</Text>
          <Input
            label="Amount"
            value={adjustmentAmount}
            onChangeText={setAdjustmentAmount}
            placeholder="1000"
            keyboardType="decimal-pad"
            inputMode="decimal"
            icon="plus-minus"
          />
          <Input
            label="Reason"
            value={adjustmentReason}
            onChangeText={setAdjustmentReason}
            placeholder="Bonus, refund, unexpected bill..."
            icon="note-text-outline"
          />
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <Button title="Add" onPress={() => saveAdjustment('add')} variant="secondary" style={{ flex: 1 }} />
            <Button title="Subtract" onPress={() => saveAdjustment('subtract')} variant="outline" style={{ flex: 1 }} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent adjustments</Text>
        {adjustments.slice(0, 4).map((item) => (
          <View key={`${item.date}-${item.reason}`} style={styles.panel}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.value}>{item.reason}</Text>
                <Text style={styles.muted}>{new Date(item.date).toLocaleDateString('en-IN')}</Text>
              </View>
              <Text style={styles.value}>
                {item.type === 'add' ? '+' : '-'}
                {formatMoney(item.amount)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
