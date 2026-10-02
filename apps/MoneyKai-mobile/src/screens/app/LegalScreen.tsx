import React from 'react';
import { View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/types';
import { AppText as Text } from '@/components/ui/AppText';
import { MoneyToolScreen, toolStyles } from '@/components/ui/MoneyToolScreen';
import { LEGAL_UPDATED, PRIVACY_SECTIONS, TERMS_SECTIONS } from '@/constants/legalContent';
import { useTheme } from '@/hooks/useTheme';

export function LegalScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'Legal'>>();
  const { colors } = useTheme();
  return <MoneyToolScreen title={params.document === 'privacy' ? 'Privacy policy' : 'Terms & conditions'} description={`Last updated ${LEGAL_UPDATED}`}>
    {(params.document === 'privacy' ? PRIVACY_SECTIONS : TERMS_SECTIONS).map((section) => <View key={section.title} style={toolStyles.section}>
      <Text style={[toolStyles.title, { color: colors.textPrimary }]}>{section.title}</Text>
      <Text style={[toolStyles.body, { color: colors.textSecondary }]}>{section.body}</Text>
    </View>)}
  </MoneyToolScreen>;
}
