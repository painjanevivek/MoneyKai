import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from './AppText';
import { CenteredPageHeader } from './CenteredPageHeader';
import { ScreenBackButton } from './ScreenBackButton';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants/theme';

export function MoneyToolScreen({ title, description, children }: React.PropsWithChildren<{ title: string; description?: string }>) {
  const { colors } = useTheme();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={toolStyles.content}>
        <CenteredPageHeader title={title} leftAction={<ScreenBackButton compact />} />
        {description ? <Text style={[toolStyles.body, { color: colors.textSecondary, marginBottom: Spacing.xl }]}>{description}</Text> : null}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function MoneyToolRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const stacked = fontScale >= 1.4 || width < 350;
  return <View style={[toolStyles.row, { borderBottomColor: colors.borderLight }, stacked ? { flexDirection: 'column', alignItems: 'stretch', gap: Spacing.xs } : null]}>
    <Text style={[toolStyles.body, { color: colors.textSecondary, flex: stacked ? undefined : 1 }]}>{label}</Text>
    <Text style={[toolStyles.body, { color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, flex: stacked ? undefined : 1, textAlign: stacked ? 'left' : 'right' }]}>{value}</Text>
  </View>;
}

export const toolStyles = StyleSheet.create({
  content: { flexGrow: 1, padding: Spacing.lg, paddingBottom: Spacing['3xl'] },
  body: { fontSize: Typography.fontSize.md, lineHeight: Typography.lineHeight.md },
  title: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl, marginBottom: Spacing.md },
  section: { marginTop: Spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 48, paddingVertical: Spacing.sm, borderBottomWidth: 1 },
});
