import React, { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { THEME_OPTIONS, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { getStoreReviewUrl } from '@/config/environment';
import { setNotificationEnabled } from '@/services/notificationService';

interface SettingItemProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

const CURRENCY_OPTIONS = [
  {
    code: 'INR',
    symbol: '\u20B9',
    label: 'Indian Rupee',
    icon: 'currency-inr',
    description: 'India-first default for budgets, transactions, and reports.',
  },
  {
    code: 'USD',
    symbol: '$',
    label: 'US Dollar',
    icon: 'currency-usd',
    description: 'Use dollars across MoneyKai balances and exports.',
  },
  {
    code: 'EUR',
    symbol: '\u20AC',
    label: 'Euro',
    icon: 'currency-eur',
    description: 'Use euros for European accounts and reports.',
  },
  {
    code: 'JPY',
    symbol: '\u00A5',
    label: 'Japanese Yen',
    icon: 'currency-jpy',
    description: 'Use yen for Japan-based spending and balances.',
  },
] as const;

const SettingItem: React.FC<SettingItemProps> = ({ icon, iconColor, iconBg, title, subtitle, right, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: BorderRadius.sm,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: Spacing.md,
        }}
      >
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>{title}</Text>
        {!!subtitle && <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {right || (onPress ? <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} /> : null)}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { user, signOut } = useAuthStore();
  const {
    notificationsEnabled,
    hapticEnabled,
    toggleHaptic,
    currency,
    currencySymbol,
    exchangeRatesUpdatedAt,
    exchangeRateError,
    refreshExchangeRates,
    setCurrency,
  } = useSettingsStore();
  const [showSignOutSheet, setShowSignOutSheet] = useState(false);
  const [showCurrencySheet, setShowCurrencySheet] = useState(false);
  const [currencyBusy, setCurrencyBusy] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const switchTrack = { false: colors.border, true: colors.primary } as const;
  const switchThumb = colors.textInverse;

  const handleNotificationsToggle = async (enabled: boolean) => {
    const granted = await setNotificationEnabled(enabled);
    if (enabled && !granted) {
      Alert.alert('Permission denied', 'Turn on notifications from your device settings to receive alerts.');
    }
  };

  const handleCurrencySelect = async (option: (typeof CURRENCY_OPTIONS)[number]) => {
    if (currencyBusy) {
      return;
    }

    setCurrencyBusy(true);
    try {
      await refreshExchangeRates(true);
    } finally {
      setCurrency(option.code, option.symbol);
      setShowCurrencySheet(false);
      setCurrencyBusy(false);
    }
  };

  const handleRate = () => {
    const url = getStoreReviewUrl(Platform.OS === 'ios' ? 'ios' : 'android');
    Linking.openURL(url).catch(() => {
      Alert.alert('Rate the App', 'Open the store listing for MoneyKai to leave a review.');
    });
  };

  const handleSignOut = async () => {
    if (signOutBusy) return;
    setSignOutBusy(true);
    try {
      await signOut();
      setShowSignOutSheet(false);
      router.replace('/login');
    } catch (err) {
      Alert.alert('Sign out failed', err instanceof Error ? err.message : 'Could not sign out right now.');
    } finally {
      setSignOutBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: Spacing['2xl'] }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <UserAvatar name={user?.full_name} email={user?.email} avatarUrl={user?.avatar_url} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                {user?.full_name || 'Your profile'}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>{user?.email || 'No email available'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile-edit' as any)} accessibilityRole="button" accessibilityLabel="Edit profile">
              <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Appearance</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <View style={{ paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: BorderRadius.sm,
                  backgroundColor: colors.primaryBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialCommunityIcons name="palette-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>Theme</Text>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>Choose a MoneyKai look</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {THEME_OPTIONS.map((option) => {
                const active = theme === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Use ${option.label} theme`}
                    activeOpacity={0.82}
                    onPress={() => setTheme(option.id)}
                    style={{
                      width: '48%',
                      minWidth: 132,
                      flexGrow: 1,
                      minHeight: 92,
                      borderRadius: BorderRadius.md,
                      borderWidth: 1.5,
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primaryBg : colors.surface,
                      padding: Spacing.sm,
                      gap: Spacing.xs,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm }}>
                      <View style={{ flexDirection: 'row' }}>
                        {option.swatches.map((swatch) => (
                          <View
                            key={swatch}
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              backgroundColor: swatch,
                              borderWidth: 1,
                              borderColor: colors.borderLight,
                              marginRight: -4,
                            }}
                          />
                        ))}
                      </View>
                      <MaterialCommunityIcons name={active ? 'check-circle' : (option.icon as any)} size={18} color={active ? colors.primary : colors.textTertiary} />
                    </View>
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{option.label}</Text>
                    <Text numberOfLines={2} style={{ fontSize: Typography.fontSize.xs, lineHeight: 16, color: colors.textSecondary }}>{option.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <SettingItem
            icon="currency-inr"
            iconColor="#707070"
            iconBg="#F1F1F1"
            title="Display Currency"
            subtitle={`${currency} (${currencySymbol}) from INR${exchangeRatesUpdatedAt ? `, rates ${new Date(exchangeRatesUpdatedAt).toLocaleDateString()}` : ''}`}
            onPress={() => setShowCurrencySheet(true)}
          />
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Notifications</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem
            icon="bell-outline"
            iconColor="#8A8A8A"
            iconBg="#F2F2F2"
            title="Push Notifications"
            subtitle={notificationsEnabled ? 'Enabled' : 'Disabled'}
            right={<Switch value={notificationsEnabled} onValueChange={handleNotificationsToggle} trackColor={switchTrack} thumbColor={switchThumb} ios_backgroundColor={colors.borderLight} />}
          />
          <SettingItem
            icon="vibrate"
            iconColor="#A3A3A3"
            iconBg="#F2F2F2"
            title="Haptic Feedback"
            subtitle={hapticEnabled ? 'Enabled' : 'Disabled'}
            right={<Switch value={hapticEnabled} onValueChange={toggleHaptic} trackColor={switchTrack} thumbColor={switchThumb} ios_backgroundColor={colors.borderLight} />}
          />
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>About</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem icon="information-outline" iconColor="#6B7280" iconBg="#F3F3F3" title="Version" subtitle="MoneyKai v1.0.0" />
          <SettingItem icon="star-outline" iconColor="#5A5A5A" iconBg="#EFEFEF" title="Rate the App" onPress={handleRate} />
          <SettingItem icon="help-circle-outline" iconColor="#707070" iconBg="#F1F1F1" title="Help & Support" subtitle="Open contact and support options" onPress={() => router.push('/contact' as any)} />
        </Card>

        <TouchableOpacity
          onPress={() => setShowSignOutSheet(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: Spacing.base,
            borderRadius: BorderRadius.md,
            backgroundColor: colors.emergencyBg,
            borderWidth: 1,
            borderColor: `${colors.emergency}30`,
          }}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.emergency} />
          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.emergency }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <ModalSheet
        visible={showCurrencySheet}
        title="Display currency"
        subtitle="MoneyKai stores amounts in INR and converts displayed values with live cached rates."
        onClose={() => (currencyBusy ? undefined : setShowCurrencySheet(false))}
        footer={<Button title="Done" onPress={() => setShowCurrencySheet(false)} variant="outline" disabled={currencyBusy} />}
      >
        <View style={{ gap: Spacing.sm }}>
          {exchangeRateError ? (
            <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
              Live rates could not refresh last time. MoneyKai will use the latest cached rate.
            </Text>
          ) : null}
          {CURRENCY_OPTIONS.map((option) => {
            const active = currency === option.code;
            return (
              <TouchableOpacity
                key={option.code}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                disabled={currencyBusy}
                accessibilityLabel={`Use ${option.label}`}
                activeOpacity={0.82}
                onPress={() => void handleCurrencySelect(option)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.md,
                  borderRadius: BorderRadius.md,
                  borderWidth: 1.5,
                  borderColor: active ? colors.primary : colors.borderLight,
                  backgroundColor: active ? colors.primaryBg : colors.surface,
                  padding: Spacing.md,
                  opacity: currencyBusy ? 0.58 : 1,
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: BorderRadius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.card,
                  }}
                >
                  <MaterialCommunityIcons name={option.icon as any} size={22} color={active ? colors.primary : colors.textSecondary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {option.code} ({option.symbol})
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                    {option.label}
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textTertiary }}>
                    {option.description}
                  </Text>
                </View>
                {active ? <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </ModalSheet>

      <ModalSheet
        visible={showSignOutSheet}
        title="Sign out"
        subtitle="You will need to sign in again to access your MoneyKai account on this device."
        onClose={() => (signOutBusy ? undefined : setShowSignOutSheet(false))}
        footer={
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
            <Button title="Cancel" onPress={() => setShowSignOutSheet(false)} variant="outline" style={{ flex: 1 }} disabled={signOutBusy} />
            <Button title="Sign Out" onPress={handleSignOut} loading={signOutBusy} style={{ flex: 1 }} />
          </View>
        }
      >
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22 }}>
          This will clear your local session and take you back to the login screen.
        </Text>
      </ModalSheet>
    </SafeAreaView>
  );
}
