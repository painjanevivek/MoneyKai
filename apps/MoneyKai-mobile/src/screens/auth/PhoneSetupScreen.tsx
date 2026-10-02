import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhoneNumberField } from '@/components/transactions/PhoneNumberField';
import { Button } from '@/components/ui/Button';
import { AppText as Text } from '@/components/ui/AppText';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionPreferencesStore } from '@/stores/useTransactionPreferencesStore';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants/theme';

export function PhoneSetupScreen() {
  const { colors } = useTheme();
  const owner = useAuthStore(state => state.user?.id);
  const [code, setCode] = useState('+91');
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: Spacing.xl }}>
    <Text accessibilityRole="header" style={{ color: colors.textPrimary, fontSize: Typography.fontSize['2xl'], marginBottom: Spacing.lg }}>Complete your profile</Text>
    <PhoneNumberField code={code} number={number} onCode={setCode} onNumber={setNumber} />
    <Text style={{ color: colors.textSecondary, marginBottom: Spacing.lg }}>Phone number is required and stored encrypted on this device. No SMS is sent; this does not verify ownership of the number.</Text>
    {error ? <Text accessibilityRole="alert" style={{ color: colors.error, marginBottom: Spacing.md }}>{error}</Text> : null}
    <Button title="Continue" onPress={() => { if (!owner || !useTransactionPreferencesStore.getState().setPhone(owner, code, number)) setError('Enter a valid country code and phone number. For +91, enter a 10-digit mobile number.'); }} />
    <Button title="Sign out" variant="ghost" onPress={() => void useAuthStore.getState().signOut()} />
  </ScrollView></SafeAreaView>;
}
