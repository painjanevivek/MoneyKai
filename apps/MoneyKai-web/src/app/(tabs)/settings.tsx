import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, Linking, Platform, Share } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { GmailConnectionCard } from '@/components/gmail/GmailConnectionCard';
import { MonthlyReset } from '@/components/dashboard/MonthlyReset';
import { THEME_OPTIONS, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { isFirebaseConfigured } from '@/services/firebase';
import { backendApi, isBackendConfigured } from '@/services/backendApi';
import { saveCloudBackup, restoreLatestCloudBackup } from '@/services/backupService';
import { setNotificationEnabled } from '@/services/notificationService';
import { resetLocalAppState } from '@/services/remoteSync';
import { getStoreReviewUrl } from '@/config/environment';

interface SettingItemProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, iconColor, iconBg, title, subtitle, right, onPress }) => {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ hovered, pressed }: any) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
        marginHorizontal: -Spacing.sm,
        borderRadius: BorderRadius.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        backgroundColor: onPress && hovered ? `${colors.primary}0F` : 'transparent',
        transform: onPress && hovered && !pressed ? [{ translateX: 2 }] : [{ translateX: 0 }],
      })}
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
      {right || (onPress && <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />)}
    </Pressable>
  );
};

function ThemeSwatches({ swatches }: { swatches: readonly string[] }) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', marginRight: Spacing.sm }}>
      {swatches.map((swatch) => (
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
  );
}

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { user, signOut } = useAuthStore();
  const { notificationsEnabled, hapticEnabled, toggleHaptic, currency, currencySymbol } = useSettingsStore();
  const { settings, updateSettings } = useBudgetStore();
  const transactions = useTransactionStore((s) => s.transactions);

  const [showAllowanceEditor, setShowAllowanceEditor] = useState(false);
  const [showBackupSheet, setShowBackupSheet] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showSignOutSheet, setShowSignOutSheet] = useState(false);
  const [showDeleteAccountSheet, setShowDeleteAccountSheet] = useState(false);
  const [allowanceValue, setAllowanceValue] = useState(String(settings.monthly_allowance));
  const [savingAllowance, setSavingAllowance] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const switchTrack = {
    false: colors.border,
    true: colors.primary,
  } as const;
  const switchThumb = colors.textInverse;
  const selectedTheme = THEME_OPTIONS.find((option) => option.id === theme) ?? THEME_OPTIONS[0];

  const allowanceSubtitle = useMemo(
    () => `${currencySymbol} ${settings.monthly_allowance.toLocaleString('en-IN')}`,
    [currencySymbol, settings.monthly_allowance]
  );

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

  const handleExport = async () => {
    try {
      if (transactions.length === 0) {
        Alert.alert('No Data', 'You have no transactions to export.');
        return;
      }

      const header = 'Date,Type,Category,Description,Amount,Payment Method\n';
      const rows = transactions.map((t) =>
        [
          t.transaction_date,
          t.type,
          t.category,
          `"${t.description.replace(/"/g, '""')}"`,
          t.amount.toString(),
          t.payment_method ?? '',
        ].join(',')
      );
      const csv = header + rows.join('\n');

      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `moneykai_transactions_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({
          title: 'MoneyKai transactions CSV',
          message: csv,
        });
      }
    } catch (err) {
      Alert.alert('Export Failed', err instanceof Error ? err.message : 'Could not export data.');
    }
  };

  const handlePrivacy = () => {
    router.push('/privacy-policy' as any);
  };

  const handleRate = () => {
    const url = getStoreReviewUrl(Platform.OS === 'ios' ? 'ios' : 'android');
    Linking.openURL(url).catch(() => {
      Alert.alert('Rate the App', 'Open the store listing for MoneyKai to leave a review.');
    });
  };

  const handleSupport = () => {
    router.push('/contact' as any);
  };

  const saveAllowance = async () => {
    const parsed = Number(allowanceValue.replace(/,/g, '').trim());
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Enter a positive monthly budget.');
      return;
    }

    setSavingAllowance(true);
    try {
      updateSettings({ monthly_allowance: parsed });
      setShowAllowanceEditor(false);
    } finally {
      setSavingAllowance(false);
    }
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    const granted = await setNotificationEnabled(enabled);
    if (enabled && !granted) {
      Alert.alert('Permission denied', 'Turn on notifications from your device settings to receive alerts.');
    }
  };

  const handleCloudBackup = async () => {
    setBackupBusy(true);
    try {
      const snapshot = await saveCloudBackup();
      Alert.alert('Backup saved', `Cloud backup created at ${new Date(snapshot.capturedAt).toLocaleString()}.`);
      setShowBackupSheet(false);
    } catch (err) {
      Alert.alert('Backup failed', err instanceof Error ? err.message : 'Could not create a cloud backup.');
    } finally {
      setBackupBusy(false);
    }
  };

  const handleCloudRestore = async () => {
    setBackupBusy(true);
    try {
      await restoreLatestCloudBackup();
      Alert.alert('Backup restored', 'Your latest cloud backup is now on this device.');
      setShowBackupSheet(false);
    } catch (err) {
      Alert.alert('Restore failed', err instanceof Error ? err.message : 'Could not restore a cloud backup.');
    } finally {
      setBackupBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!isBackendConfigured()) {
      Alert.alert('Delete unavailable', 'Account deletion requires the MoneyKai backend to be configured.');
      return;
    }

    if (!user?.id || deleteBusy) {
      return;
    }

    setDeleteBusy(true);
    setShowDeleteAccountSheet(false);
    try {
      await backendApi.deleteAccount();
      resetLocalAppState();
      await signOut({ skipFinalBackup: true });
      router.replace('/login');
    } catch (err) {
      Alert.alert('Delete failed', err instanceof Error ? err.message : 'Could not delete your account right now.');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <UserAvatar name={user?.full_name} email={user?.email} avatarUrl={user?.avatar_url} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{user?.full_name || 'Your profile'}</Text>
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>{user?.email || 'No email available'}</Text>
            </View>
            <Pressable
              onPress={() => router.push('/profile-edit' as any)}
              style={({ hovered, pressed }: any) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: hovered ? `${colors.primary}14` : 'transparent',
                transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
              })}
            >
              <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Budget</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem
            icon="wallet-outline"
            iconColor="#111111"
            iconBg="#F4F4F4"
            title="Monthly Budget"
            subtitle={allowanceSubtitle}
            onPress={() => {
              setAllowanceValue(String(settings.monthly_allowance));
              setShowAllowanceEditor(true);
            }}
          />
          <SettingItem
            icon="transfer"
            iconColor="#444444"
            iconBg="#ECECEC"
            title="Carry Forward"
            subtitle="Move unused balance to the next month"
            right={
              <Switch
                value={settings.carry_forward}
                onValueChange={(v) => updateSettings({ carry_forward: v })}
                trackColor={switchTrack}
                thumbColor={switchThumb}
                ios_backgroundColor={colors.borderLight}
              />
            }
          />
        </Card>

        <View style={{ marginBottom: Spacing.lg }}>
          <MonthlyReset />
        </View>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Appearance</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose website theme"
            onPress={() => setShowThemePicker(true)}
            style={({ hovered, pressed }: any) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: Spacing.md,
              paddingHorizontal: Spacing.sm,
              marginHorizontal: -Spacing.sm,
              borderRadius: BorderRadius.sm,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderLight,
              backgroundColor: hovered ? `${colors.primary}0F` : 'transparent',
              transform: hovered && !pressed ? [{ translateX: 2 }] : [{ translateX: 0 }],
            })}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: BorderRadius.sm,
                backgroundColor: colors.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: Spacing.md,
              }}
            >
              <MaterialCommunityIcons name="palette-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>Theme</Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>Choose a MoneyKai look</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <ThemeSwatches swatches={selectedTheme.swatches} />
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                {selectedTheme.label}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textTertiary} />
            </View>
          </Pressable>
          <SettingItem icon="currency-inr" iconColor="#707070" iconBg="#F1F1F1" title="Currency" subtitle={`${currency} (${currencySymbol})`} />
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Notifications</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem
            icon="bell-outline"
            iconColor="#8A8A8A"
            iconBg="#F2F2F2"
            title="Push Notifications"
            subtitle={notificationsEnabled ? 'Enabled' : 'Disabled'}
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={switchTrack}
                thumbColor={switchThumb}
                ios_backgroundColor={colors.borderLight}
              />
            }
          />
          <SettingItem
            icon="vibrate"
            iconColor="#A3A3A3"
            iconBg="#F2F2F2"
            title="Haptic Feedback"
            subtitle={hapticEnabled ? 'Enabled' : 'Disabled'}
            right={
              <Switch
                value={hapticEnabled}
                onValueChange={toggleHaptic}
                trackColor={switchTrack}
                thumbColor={switchThumb}
                ios_backgroundColor={colors.borderLight}
              />
            }
          />
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>Data & Privacy</Text>
        <GmailConnectionCard />
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem icon="download-outline" iconColor="#111111" iconBg="#F4F4F4" title="Export Data (CSV)" subtitle="Share your transactions as CSV" onPress={handleExport} />
          <SettingItem icon="cloud-upload-outline" iconColor="#2B2B2B" iconBg="#F2F2F2" title="Cloud backups" subtitle="Save to or restore a cloud backup" onPress={() => setShowBackupSheet(true)} />
          <SettingItem icon="shield-lock-outline" iconColor="#444444" iconBg="#ECECEC" title="Privacy Policy" subtitle="Open the privacy policy" onPress={handlePrivacy} />
          <SettingItem icon="delete-outline" iconColor={colors.emergency} iconBg={colors.emergencyBg} title="Delete Account" subtitle="Permanently remove your account and stored data" onPress={() => setShowDeleteAccountSheet(true)} />
        </Card>

        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>About</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <SettingItem icon="information-outline" iconColor="#6B7280" iconBg="#F3F3F3" title="Version" subtitle="MoneyKai v1.0.0" />
          <SettingItem icon="star-outline" iconColor="#5A5A5A" iconBg="#EFEFEF" title="Rate the App" onPress={handleRate} />
          <SettingItem icon="help-circle-outline" iconColor="#707070" iconBg="#F1F1F1" title="Help & Support" subtitle="Open contact and support options" onPress={handleSupport} />
        </Card>

        <Pressable
          onPress={() => setShowSignOutSheet(true)}
          style={({ hovered, pressed }: any) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: Spacing.base,
            borderRadius: BorderRadius.md,
            backgroundColor: hovered ? `${colors.emergency}24` : colors.emergencyBg,
            borderWidth: 1,
            borderColor: hovered ? `${colors.emergency}70` : `${colors.emergency}30`,
            transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
          })}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.emergency} />
          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.emergency }}>Sign Out</Text>
        </Pressable>
      </ScrollView>

      <ModalSheet
        visible={showThemePicker}
        title="Website theme"
        subtitle="Pick a named theme. The color palette is shown before each name."
        onClose={() => setShowThemePicker(false)}
      >
        <View style={{ gap: Spacing.sm }}>
          {THEME_OPTIONS.map((option) => {
            const active = theme === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Use ${option.label} theme`}
                onPress={() => {
                  setTheme(option.id);
                  setShowThemePicker(false);
                }}
                style={({ hovered, pressed }: any) => ({
                  minHeight: 58,
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: Spacing.md,
                  borderRadius: BorderRadius.sm,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : hovered ? `${colors.primary}80` : colors.borderLight,
                  backgroundColor: active ? colors.primaryBg : hovered ? colors.surfaceElevated : colors.surface,
                  transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                })}
              >
                <ThemeSwatches swatches={option.swatches} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{option.label}</Text>
                  <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{option.description}</Text>
                </View>
                <MaterialCommunityIcons name={active ? 'check-circle' : 'circle-outline'} size={20} color={active ? colors.primary : colors.textTertiary} />
              </Pressable>
            );
          })}
        </View>
      </ModalSheet>

      <ModalSheet
        visible={showAllowanceEditor}
        title="Edit Monthly Budget"
        subtitle="Update the budget used across your savings and dashboard calculations."
        onClose={() => setShowAllowanceEditor(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
            <Button title="Cancel" onPress={() => setShowAllowanceEditor(false)} variant="outline" style={{ flex: 1 }} />
            <Button title="Save" onPress={saveAllowance} loading={savingAllowance} style={{ flex: 1 }} />
          </View>
        }
      >
        <Input
          label="Monthly budget"
          placeholder="15000"
          value={allowanceValue}
          onChangeText={(value) => setAllowanceValue(value.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          prefix="Rs"
        />
      </ModalSheet>

      <ModalSheet
        visible={showBackupSheet}
        title="Cloud backups"
        subtitle={
          isBackendConfigured()
            ? 'Make sure the MoneyKai backend is running and Firestore is available for cloud backups.'
            : isFirebaseConfigured()
              ? 'Create Firestore once in Firebase Console before your first cloud backup.'
              : 'Firebase is required for cloud backups.'
        }
        onClose={() => setShowBackupSheet(false)}
        footer={
          <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
            <Button title="Back Up Now" onPress={handleCloudBackup} loading={backupBusy} disabled={!isFirebaseConfigured() && !isBackendConfigured()} />
            <Button title="Restore Latest Backup" onPress={handleCloudRestore} variant="outline" loading={backupBusy} disabled={!isFirebaseConfigured() && !isBackendConfigured()} />
          </View>
        }
      >
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
            Cloud backups store your current transactions, linked accounts, notes, groups, challenges, badges, budget, and settings in Firebase so you can restore them on another device.
          </Text>
          <View style={{ padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: `${colors.primary}22` }}>
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary, marginBottom: 4 }}>
              First backup checklist
            </Text>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
              1. The MoneyKai backend is deployed and reachable.{"\n"}
              2. Firestore database exists in Firebase Console.{"\n"}
              3. You are signed in to MoneyKai with a real Firebase account.{"\n"}
              4. Firestore permissions allow the backend service account to store backups.
            </Text>
          </View>
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

      <ModalSheet
        visible={showDeleteAccountSheet}
        title="Delete account"
        subtitle="This permanently removes your MoneyKai account, stored data, and backups."
        onClose={() => (deleteBusy ? undefined : setShowDeleteAccountSheet(false))}
        footer={
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
            <Button title="Cancel" onPress={() => setShowDeleteAccountSheet(false)} variant="outline" style={{ flex: 1 }} disabled={deleteBusy} />
            <Button title="Delete" onPress={handleDeleteAccount} variant="danger" loading={deleteBusy} style={{ flex: 1 }} disabled={!isBackendConfigured()} />
          </View>
        }
      >
        <View style={{ gap: Spacing.md }}>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22 }}>
            Deleting your account removes transactions, linked accounts, notes, budgets, groups, savings goals, notifications, backups, and your profile from MoneyKai.
          </Text>
          <View style={{ padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.emergencyBg, borderWidth: 1, borderColor: `${colors.emergency}22` }}>
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.emergency, marginBottom: 4 }}>
              This cannot be undone
            </Text>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
              Make sure you have exported anything you want to keep before continuing.
            </Text>
          </View>
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}
