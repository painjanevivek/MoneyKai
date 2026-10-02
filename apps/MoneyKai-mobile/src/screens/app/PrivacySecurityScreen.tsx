import React from 'react';
import { Alert, Linking, ScrollView, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { CenteredPageHeader } from '@/components/ui/CenteredPageHeader';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { SITE } from '@/constants/site';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { RootStackParamList } from '@/navigation/types';

export function PrivacySecurityScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const openPrivacyPolicy = () => {
    void Linking.openURL(`${SITE.url}/privacy-policy`).catch(() =>
      Alert.alert('Privacy policy unavailable', 'Could not open the privacy policy right now. Please try again later.'));
  };
  const contactSupport = () => {
    void Linking.openURL(`mailto:${SITE.supportEmail}?subject=${encodeURIComponent('MoneyKai privacy question')}`).catch(() =>
      Alert.alert('Email unavailable', `Contact us at ${SITE.supportEmail}.`));
  };
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing['3xl'], paddingHorizontal: Spacing.xl }} showsVerticalScrollIndicator={false}>
        <CenteredPageHeader title="Privacy & security" leftAction={<ScreenBackButton compact />} style={{ marginBottom: Spacing.xl }} />
        <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, lineHeight: 21, marginBottom: Spacing['2xl'] }}>
          Review the safeguards on this device and find the controls for your MoneyKai data.
        </Text>

        <Text accessibilityRole="header" style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, marginBottom: Spacing.md }}>Device protection</Text>
        <View style={{ backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.lg }}>
          <View style={{ alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.base }}>
            <AppIcon name="shield-lock-outline" color={colors.textPrimary} size={22} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xl }}>App lock</Text>
              <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, lineHeight: 20, marginTop: Spacing.xs }}>
                When enabled, MoneyKai asks your device to authenticate you. Your fingerprint or face data stays with the device.
              </Text>
              <PressableScale accessibilityRole="button" onPress={() => navigation.navigate('Settings', { focus: 'appLock' })} style={{ alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44, marginTop: Spacing.sm }}>
                <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md }}>Manage app lock ›</Text>
              </PressableScale>
            </View>
          </View>
        </View>

        <Text accessibilityRole="header" style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, marginBottom: Spacing.md, marginTop: Spacing['2xl'] }}>Your data</Text>
        <View style={{ backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden' }}>
          <PrivacyRow label="Backup & sync" icon="cloud-upload-outline" onPress={() => navigation.navigate('Settings', { focus: 'cloud' })} />
          <View style={{ borderBottomColor: colors.borderLight, borderBottomWidth: 1, marginLeft: 62, marginRight: Spacing.base }} />
          <PrivacyRow label="Export data" icon="file-export-outline" onPress={() => navigation.navigate('Settings', { focus: 'export' })} />
        </View>

        <Text accessibilityRole="header" style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, marginBottom: Spacing.md, marginTop: Spacing['2xl'] }}>Legal & contact</Text>
        <View style={{ backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden' }}>
          <PrivacyRow label="Privacy policy" icon="file-document-outline" onPress={openPrivacyPolicy} />
          <View style={{ borderBottomColor: colors.borderLight, borderBottomWidth: 1, marginLeft: 62, marginRight: Spacing.base }} />
          <PrivacyRow label="Ask a privacy question" icon="email-outline" onPress={contactSupport} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PrivacyRow({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.base, minHeight: 64, paddingHorizontal: Spacing.lg }}>
      <AppIcon name={icon} color={colors.textPrimary} size={21} />
      <Text style={{ color: colors.textPrimary, flex: 1, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xl }}>{label}</Text>
      <AppIcon name="chevron-right" color={colors.textTertiary} size={19} />
    </PressableScale>
  );
}
