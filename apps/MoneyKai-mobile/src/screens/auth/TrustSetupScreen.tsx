import React from 'react';
import { ScrollView, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon as MaterialCommunityIcons } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';

const TRUST_POINTS = [
  ['check-circle-outline', 'MoneyKai saves only records you confirm.'],
  ['account-outline', 'Participant names are labels in your ledger, not verified MoneyKai accounts.'],
  ['bank-transfer', 'Settlements are recorded here after payment happens elsewhere. MoneyKai does not move money.'],
] as const;

export function TrustSetupScreen() {
  const { colors } = useTheme();
  const setOnboarded = useAuthStore((state) => state.setOnboarded);

  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: Spacing.xl }}>
        <Text style={{ color: colors.primaryDark, fontFamily: Typography.fontFamily.semiBold, fontSize: 11, letterSpacing: 1.4 }}>PRIVACY & TRUST</Text>
        <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: 39, letterSpacing: -1.1, lineHeight: 43, marginTop: Spacing.md }}>Your money stays yours.</Text>
        <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 22, marginTop: Spacing.md }}>A clear ledger should also be honest about what it can—and cannot—do.</Text>

        <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.base, marginTop: Spacing.xl, padding: Spacing.lg }}>
          {TRUST_POINTS.map(([icon, copy]) => (
            <View key={copy} style={{ alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.md }}>
              <View style={{ alignItems: 'center', backgroundColor: colors.primaryBg, borderRadius: BorderRadius.full, height: 36, justifyContent: 'center', width: 36 }}>
                <MaterialCommunityIcons name={icon} color={colors.primaryDark} size={19} />
              </View>
              <Text style={{ color: colors.textPrimary, flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 21, paddingTop: 7 }}>{copy}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: Spacing.sm, marginTop: Spacing.xl }}>
          <Button title="I understand" icon="arrow-right" iconPosition="right" onPress={() => setOnboarded(true)} size="lg" fullWidth />
          <Button title="Not now" variant="ghost" onPress={() => setOnboarded(true)} accessibilityHint="Dismisses this explanation and opens your overview. Trust information remains available from Account." fullWidth />
        </View>
        <Text style={{ color: colors.textTertiary, fontSize: Typography.fontSize.xs, lineHeight: 18, marginTop: Spacing.md, textAlign: 'center' }}>You can revisit privacy and trust from Account at any time.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
