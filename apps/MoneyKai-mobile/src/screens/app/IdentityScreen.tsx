import React, { useState } from 'react';
import { Alert, Linking, ScrollView, Switch, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/ui/PressableScale';
import { CenteredPageHeader } from '@/components/ui/CenteredPageHeader';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { DeleteAccountSheet } from '@/components/security/DeleteAccountSheet';
import { AppIcon } from '@/components/ui/AppIcon';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { SITE } from '@/constants/site';
import { useTheme } from '@/hooks/useTheme';
import type { AppTabParamList, RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useHomeModeStore } from '@/stores/useHomeModeStore';
import { hapticForSelection, vibrateForImportantEvent } from '@/services/hapticsService';
import { createAppScreenStyles } from './screenStyles';
import { getFloatingDockLayout } from '@/utils/floatingDockLayout';

type ProfileNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type ProfileItem = {
  haptic?: boolean;
  label: string;
  subtitle?: string;
  icon: string;
  onPress?: () => void;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
};

export function IdentityScreen() {
  const navigation = useNavigation<ProfileNavigation>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const hapticEnabled = useSettingsStore((state) => state.hapticEnabled);
  const toggleHaptic = useSettingsStore((state) => state.toggleHaptic);
  const appLockEnabled = useSettingsStore((state) => state.appLockEnabled);
  const basicMode = useHomeModeStore((state) => state.mode === 'basic');
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { contentPaddingBottom } = getFloatingDockLayout(fontScale, insets.bottom, basicMode);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const openEmail = (subject: string) => {
    const url = `mailto:${SITE.supportEmail}?subject=${encodeURIComponent(subject)}`;
    void Linking.openURL(url).catch(() => Alert.alert('Email unavailable', `Contact us at ${SITE.supportEmail}.`));
  };
  const openPrivacyPolicy = () => {
    void Linking.openURL(`${SITE.url}/privacy-policy`).catch(() => Alert.alert('Privacy policy unavailable', 'Could not open the privacy policy right now. Please try again later.'));
  };
  const confirmSignOut = () => {
    Alert.alert('Sign out of MoneyKai?', 'You will need to sign in again to access your account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };
  const preferences: ProfileItem[] = [
    { label: 'Notifications & alerts', subtitle: 'Alert delivery and recent updates', icon: 'bell-outline', onPress: () => navigation.navigate('Settings', { focus: 'notifications' }) },
    { label: 'Haptics', subtitle: 'Touch feedback & important events', icon: 'vibrate', value: hapticEnabled, onValueChange: () => { toggleHaptic(); vibrateForImportantEvent(); } },
    ...(hapticEnabled ? [{ label: 'Test haptics', haptic: false, icon: 'vibrate', onPress: () => { void hapticForSelection().then(played => { if (!played) Alert.alert('Touch feedback unavailable', 'Check Android’s touch vibration setting and vibration intensity. MoneyKai does not override system settings.'); }); } }] : []),
  ];
  const securityAndData: ProfileItem[] = [
    { label: 'App lock', subtitle: appLockEnabled ? 'On · Device authentication' : 'Off · Device authentication', icon: 'cellphone-lock', onPress: () => navigation.navigate('Settings', { focus: 'appLock' }) },
    { label: 'Backup & sync', icon: 'cloud-upload-outline', onPress: () => navigation.navigate('Settings', { focus: 'cloud' }) },
    { label: 'Export data', icon: 'file-export-outline', onPress: () => navigation.navigate('Settings', { focus: 'export' }) },
    { label: 'Privacy & security', icon: 'shield-check-outline', onPress: () => navigation.navigate('PrivacySecurity') },
    { label: 'Change password', icon: 'lock-outline', onPress: () => navigation.navigate('Settings', { focus: 'password' }) },
    { label: 'Delete account', subtitle: 'Permanently remove account and synced data', icon: 'delete-outline', onPress: () => setDeleteVisible(true) },
  ];
  const support: ProfileItem[] = [
    { label: 'Help & support', icon: 'help-circle-outline', onPress: () => openEmail('MoneyKai support') },
    { label: 'Send feedback', icon: 'message-text-outline', onPress: () => openEmail('MoneyKai feedback') },
    { label: 'About MoneyKai', icon: 'information-outline', onPress: () => setAboutVisible(true) },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(contentPaddingBottom, basicMode ? 120 : 156), paddingHorizontal: Spacing.xl }]} showsVerticalScrollIndicator={false}>
        <CenteredPageHeader title="Profile" style={{ marginBottom: Spacing.lg }} />

        <PressableScale accessibilityLabel="Open account details" accessibilityRole="button" onPress={() => navigation.navigate('ProfileEdit')} style={{ alignItems: 'center', backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: BorderRadius.lg, borderWidth: 1, flexDirection: 'row', gap: Spacing.base, minHeight: 78, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md }}>
          <UserAvatar name={user?.full_name} email={user?.email} avatarUrl={user?.avatar_url} size={42} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl }}>{user?.full_name || 'Your profile'}</Text>
            <Text numberOfLines={1} style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, marginTop: 2 }}>{user?.email || 'Manage your details'}</Text>
          </View>
          <AppIcon name="chevron-right" color={colors.textSecondary} size={21} />
        </PressableScale>

        <ProfileSection title="Preferences" items={preferences} />
        <ProfileSection title="Security & data" items={securityAndData} />
        <ProfileSection title="Support" items={support} />

        <PressableScale accessibilityLabel="Sign out" accessibilityRole="button" onPress={confirmSignOut} style={{ alignItems: 'center', alignSelf: 'center', backgroundColor: '#FFF2F3', borderColor: '#F2C6CB', borderRadius: BorderRadius.full, borderWidth: 1, justifyContent: 'center', marginTop: Spacing['2xl'], minHeight: 48, minWidth: 156, paddingHorizontal: Spacing.xl }}>
          <Text style={{ color: '#B84050', fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md }}>Sign out</Text>
        </PressableScale>
      </ScrollView>

      <ModalSheet visible={aboutVisible} title="About MoneyKai" onClose={() => setAboutVisible(false)} maxHeight={360}>
        <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, lineHeight: 21, marginBottom: Spacing.lg }}>
          MoneyKai helps you keep spending, budgets, and shared balances clear. Your profile is where you control the app and your data.
        </Text>
        <PressableScale accessibilityRole="button" onPress={openPrivacyPolicy} style={{ alignItems: 'center', borderTopColor: colors.borderLight, borderTopWidth: 1, flexDirection: 'row', minHeight: 52 }}>
          <Text style={{ color: colors.textPrimary, flex: 1, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md }}>Privacy policy</Text>
          <AppIcon name="chevron-right" color={colors.textSecondary} size={19} />
        </PressableScale>
        <Text style={{ color: colors.textTertiary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, marginTop: Spacing.md }}>Support: {SITE.supportEmail}</Text>
      </ModalSheet>
      <DeleteAccountSheet visible={deleteVisible} onClose={() => setDeleteVisible(false)} signOut={signOut} />
    </SafeAreaView>
  );
}

function ProfileSection({ items, title }: { items: ProfileItem[]; title: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: Spacing['2xl'] }}>
      <Text accessibilityRole="header" style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, marginBottom: Spacing.md }}>{title}</Text>
      <View style={{ backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden' }}>
        {items.map((item, index) => <ProfileRow key={item.label} item={item} last={index === items.length - 1} />)}
      </View>
    </View>
  );
}

function ProfileRow({ item, last = false }: { item: ProfileItem; last?: boolean }) {
  const { colors } = useTheme();
  const content = (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.base, minHeight: 67, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md }}>
      <View style={{ alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: BorderRadius.md, height: 40, justifyContent: 'center', width: 40 }}><AppIcon name={item.icon} color={colors.textPrimary} size={22} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xl }}>{item.label}</Text>
        {item.subtitle ? <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, marginTop: 2 }}>{item.subtitle}</Text> : null}
      </View>
      {item.onValueChange ? <Switch accessibilityLabel={item.label} value={Boolean(item.value)} onValueChange={item.onValueChange} trackColor={{ false: colors.border, true: colors.textPrimary }} thumbColor={colors.card} /> : <AppIcon name="chevron-right" color={colors.textTertiary} size={20} />}
    </View>
  );
  return (
    <>
      {item.onPress ? <PressableScale haptic={item.haptic} accessibilityLabel={item.label} accessibilityRole="button" onPress={item.onPress}>{content}</PressableScale> : content}
      {!last ? <View style={{ borderBottomColor: colors.borderLight, borderBottomWidth: 1, marginLeft: 68, marginRight: Spacing.base }} /> : null}
    </>
  );
}
