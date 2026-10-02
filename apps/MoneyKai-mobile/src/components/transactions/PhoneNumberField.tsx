import React from 'react';
import { View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Spacing } from '@/constants/theme';
import { phoneDigits } from '@/utils/transactionPreferences';

export function PhoneNumberField({ code, number, onCode, onNumber, outlined = false }: { code: string; number: string; onCode: (code: string) => void; onNumber: (number: string) => void; outlined?: boolean }) {
  return <View style={{ flexDirection: 'row', gap: Spacing.md }}>
    <Input variant={outlined ? 'outlined' : 'underline'} label="Country code" prefix="+" value={code.replace(/^\+/, '')} onChangeText={value => onCode(`+${phoneDigits(value).slice(0, 3)}`)} keyboardType="number-pad" maxLength={3} autoCorrect={false} style={{ width: outlined ? 104 : 96 }} />
    <Input variant={outlined ? 'outlined' : 'underline'} label="Phone number" placeholder="Phone number" value={number} onChangeText={value => onNumber(phoneDigits(value).slice(0, 14))} keyboardType="phone-pad" autoCorrect={false} autoComplete="tel-national" textContentType="telephoneNumber" maxLength={14} style={{ flex: 1, minWidth: 0 }} />
  </View>;
}
