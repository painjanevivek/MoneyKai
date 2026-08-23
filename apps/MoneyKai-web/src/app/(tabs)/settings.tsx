import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, Linking, Platform, Share } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { GmailConnectionCard } from '@/components/gmail/GmailConnectionCard';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';
import { isFirebaseConfigured } from '@/services/firebase';
import { backendApi, isBackendConfigured } from '@/services/backendApi';
import { trackUserEvent } from '@/services/analytics';
import { changePasswordGateway } from '@/services/authGateway';
import {
  getLatestCloudBackupMetadata,
  saveCloudBackup,
  restoreLatestCloudBackup,
  summarizeBackupSnapshot,
  type MoneyKaiBackupMetadata,
} from '@/services/backupService';
import { setNotificationEnabled } from '@/services/notificationService';
import { resetLocalAppState } from '@/services/remoteSync';
import { getStoreReviewUrl } from '@/config/environment';
import { formatCurrency } from '@/utils/formatCurrency';

interface SettingItemProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

type ExportFormat = 'word' | 'excel' | 'pdf';

const EXPORT_COLUMNS = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method'] as const;

const CURRENCY_OPTIONS = [
  {
    code: 'INR',
    symbol: '₹',
    label: 'Indian Rupee',
    icon: 'currency-inr',
    description: 'India-first default for MoneyKai budgets and reports.',
  },
  {
    code: 'USD',
    symbol: '$',
    label: 'US Dollar',
    icon: 'currency-usd',
    description: 'Use dollars across budgets, transactions, and exports.',
  },
  {
    code: 'EUR',
    symbol: '€',
    label: 'Euro',
    icon: 'currency-eur',
    description: 'Use euros for European accounts and reports.',
  },
  {
    code: 'JPY',
    symbol: '¥',
    label: 'Japanese Yen',
    icon: 'currency-jpy',
    description: 'Use yen for Japan-based spending and balances.',
  },
] as const;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getExportFilename = (extension: string): string =>
  `moneykai_transactions_${new Date().toISOString().split('T')[0]}.${extension}`;

const formatBackupDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }
  return date.toLocaleString();
};

const formatBackupCount = (count: number, singular: string, plural = `${singular}s`): string =>
  `${count} ${count === 1 ? singular : plural}`;

const buildBackupConfirmationMessage = (metadata: MoneyKaiBackupMetadata): string =>
  [
    `Created: ${formatBackupDateTime(metadata.capturedAt)}`,
    `Account: ${metadata.accountName || metadata.accountEmail}`,
    `Records: ${formatBackupCount(metadata.transactionCount, 'transaction')}, ${formatBackupCount(metadata.linkedAccountCount, 'linked account')}, ${formatBackupCount(metadata.noteCount, 'note')}`,
    `Groups and goals: ${formatBackupCount(metadata.groupCount, 'group')}, ${formatBackupCount(metadata.challengeCount, 'savings goal')}`,
    `Totals: ${formatCurrency(metadata.totalIncome, metadata.currency, true)} income, ${formatCurrency(metadata.totalExpense, metadata.currency, true)} expenses`,
    '',
    'Protected restore: this operation replaces your current cloud and device data with the latest backup.',
    'Keep a separate export before continuing. If restore is interrupted, do not retry until MoneyKai shows a clear recovery result.',
  ].join('\n');

const getPasswordChangeErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : '';

  if (/too many/i.test(message)) {
    return 'Too many password change attempts. Please wait a moment and try again.';
  }

  if (/between 8 and 128 characters/i.test(message)) {
    return 'Your new password must be between 8 and 128 characters.';
  }

  return 'We could not change your password. Confirm your current password and try again.';
};

const downloadBlob = (content: string, mimeType: string, filename: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const buildTransactionRows = (
  transactions: ReturnType<typeof useTransactionStore.getState>['transactions']
) =>
  transactions.map((transaction) => [
    transaction.transaction_date,
    transaction.type,
    transaction.category,
    transaction.description,
    formatCurrency(Number(transaction.amount), undefined, true),
    transaction.payment_method ?? '',
  ]);

const buildTableMarkup = (rows: string[][]) => `
  <table>
    <thead>
      <tr>${EXPORT_COLUMNS.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
        .join('')}
    </tbody>
  </table>
`;

const buildExportHtml = (rows: string[][], title: string): string => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #14211d; margin: 24px; }
      h1 { font-size: 20px; margin: 0 0 6px; }
      p { color: #52625d; margin: 0 0 18px; font-size: 12px; }
      table { border-collapse: collapse; width: 100%; font-size: 12px; }
      th { background: #0f766e; color: #ffffff; text-align: left; }
      th, td { border: 1px solid #cddbd6; padding: 8px; vertical-align: top; }
      tr:nth-child(even) td { background: #f4faf8; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <p>Generated by MoneyKai on ${escapeHtml(new Date().toLocaleString())}</p>
    ${buildTableMarkup(rows)}
  </body>
</html>`;

const buildPlainTextTable = (rows: string[][]): string =>
  [EXPORT_COLUMNS.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n');

const printPdfTable = (html: string): boolean => {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');
  if (!printWindow) {
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 300);
  return true;
};

const SettingItem: React.FC<SettingItemProps> = ({ icon, iconColor, iconBg, title, subtitle, right, onPress }) => {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? title : undefined}
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

function SettingsSubsection({
  title,
  description,
  children,
}: React.PropsWithChildren<{ title: string; description: string }>) {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
        {title}
      </Text>
      <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
        {description}
      </Text>
      <View style={{ marginTop: Spacing.sm }}>{children}</View>
    </View>
  );
}

function ExportFormatOption({
  icon,
  title,
  description,
  onPress,
}: {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ hovered, pressed }: any) => ({
        minHeight: 72,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: hovered ? `${colors.primary}66` : colors.borderLight,
        backgroundColor: hovered ? colors.surfaceElevated : colors.surface,
        transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
      })}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: BorderRadius.sm,
          backgroundColor: colors.primaryBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name={icon as any} size={21} color={colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
          {title}
        </Text>
        <Text style={{ marginTop: 3, fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
          {description}
        </Text>
      </View>
      <MaterialCommunityIcons name="download-outline" size={20} color={colors.textTertiary} />
    </Pressable>
  );
}

function CurrencyOption({
  active,
  disabled = false,
  option,
  onPress,
}: {
  active: boolean;
  disabled?: boolean;
  option: (typeof CURRENCY_OPTIONS)[number];
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: active, disabled }}
      accessibilityLabel={`Use ${option.label}`}
      disabled={disabled}
      onPress={onPress}
      style={({ hovered, pressed }: any) => ({
        minHeight: 72,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: active ? colors.primary : hovered ? `${colors.primary}66` : colors.borderLight,
        backgroundColor: active ? colors.primaryBg : hovered ? colors.surfaceElevated : colors.surface,
        opacity: disabled ? 0.58 : 1,
        transform: hovered && !pressed && !disabled ? [{ translateY: -1 }] : [{ translateY: 0 }],
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: BorderRadius.sm,
          backgroundColor: active ? colors.primary : colors.primaryBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons name={option.icon as any} size={22} color={active ? colors.textInverse : colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            {option.code} ({option.symbol})
          </Text>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>{option.label}</Text>
        </View>
        <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
          {option.description}
        </Text>
      </View>
      <MaterialCommunityIcons name={active ? 'check-circle' : 'circle-outline'} size={20} color={active ? colors.primary : colors.textTertiary} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
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
  const transactions = useTransactionStore((s) => s.transactions);

  const [showBackupSheet, setShowBackupSheet] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [showChangePasswordSheet, setShowChangePasswordSheet] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showSignOutSheet, setShowSignOutSheet] = useState(false);
  const [showDeleteAccountSheet, setShowDeleteAccountSheet] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMetadata, setBackupMetadata] = useState<MoneyKaiBackupMetadata | null>(null);
  const [backupMetadataError, setBackupMetadataError] = useState<string | null>(null);
  const [backupMetadataLoading, setBackupMetadataLoading] = useState(false);
  const [currencyBusy, setCurrencyBusy] = useState(false);
  const [changePasswordBusy, setChangePasswordBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const switchTrack = {
    false: colors.border,
    true: colors.primary,
  } as const;
  const switchThumb = colors.textInverse;
  const backupConfigured = isFirebaseConfigured() || isBackendConfigured();

  const loadBackupMetadata = useCallback(async () => {
    if (!backupConfigured) {
      setBackupMetadata(null);
      setBackupMetadataError(null);
      return null;
    }

    setBackupMetadataLoading(true);
    setBackupMetadataError(null);
    try {
      const metadata = await getLatestCloudBackupMetadata();
      setBackupMetadata(metadata);
      return metadata;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load the latest backup details.';
      setBackupMetadata(null);
      setBackupMetadataError(message);
      return null;
    } finally {
      setBackupMetadataLoading(false);
    }
  }, [backupConfigured]);

  useEffect(() => {
    if (showBackupSheet) {
      const timeout = setTimeout(() => {
        void loadBackupMetadata();
      }, 0);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [loadBackupMetadata, showBackupSheet]);

  const handleCurrencySelect = async (option: (typeof CURRENCY_OPTIONS)[number]) => {
    if (currencyBusy) {
      return;
    }

    setCurrencyBusy(true);
    try {
      await refreshExchangeRates(true);
    } finally {
      setCurrency(option.code, option.symbol);
      setShowCurrencyPicker(false);
      setCurrencyBusy(false);
    }
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

  const handleExport = async (format: ExportFormat) => {
    try {
      if (transactions.length === 0) {
        Alert.alert('No Data', 'You have no transactions to export.');
        return;
      }

      const rows = buildTransactionRows(transactions);
      const html = buildExportHtml(rows, 'MoneyKai Transactions');
      setShowExportSheet(false);

      if (Platform.OS === 'web') {
        if (format === 'word') {
          downloadBlob(html, 'application/msword;charset=utf-8', getExportFilename('doc'));
          return;
        }

        if (format === 'excel') {
          downloadBlob(html, 'application/vnd.ms-excel;charset=utf-8', getExportFilename('xls'));
          return;
        }

        if (!printPdfTable(html)) {
          Alert.alert('PDF popup blocked', 'Allow popups for MoneyKai, then choose Export PDF again.');
        }
      } else {
        await Share.share({
          title: 'MoneyKai transactions table',
          message: buildPlainTextTable(rows),
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
    const url = getStoreReviewUrl(Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web');
    if (!url) {
      Alert.alert(
        'Reviews coming soon',
        'Thanks for wanting to rate MoneyKai. Store reviews will open here as soon as the live listing URL is configured. For launch feedback, use Help & Support from Settings.'
      );
      return;
    }

    Linking.openURL(url).catch(() => {
      Alert.alert('Review unavailable', 'MoneyKai could not open the store listing right now. Please try again later.');
    });
  };

  const handleSupport = () => {
    router.push('/contact' as any);
  };

  const clearChangePasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordError(null);
  };

  const closeChangePasswordSheet = () => {
    if (changePasswordBusy) {
      return;
    }

    clearChangePasswordForm();
    setShowChangePasswordSheet(false);
  };

  const openChangePasswordSheet = () => {
    if (user?.auth_provider === 'google') {
      Alert.alert(
        'Google sign-in account',
        'This account signs in with Google, so its password is managed by Google. You can continue using Google to sign in to MoneyKai.'
      );
      return;
    }

    if (!user?.email) {
      Alert.alert('Email unavailable', 'MoneyKai could not find an email address for this account.');
      return;
    }

    clearChangePasswordForm();
    setShowChangePasswordSheet(true);
  };

  const handleChangePassword = async () => {
    if (changePasswordBusy) {
      return;
    }

    if (!user?.email || user.auth_provider === 'google') {
      setChangePasswordError('Password changes are only available for email and password accounts.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setChangePasswordError('Enter your current password, new password, and confirmation.');
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      setChangePasswordError('Your new password must be between 8 and 128 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError('Your new password and confirmation do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setChangePasswordError('Choose a new password that is different from your current password.');
      return;
    }

    setChangePasswordBusy(true);
    setChangePasswordError(null);
    try {
      const normalizedEmail = user.email.trim().toLowerCase();
      trackUserEvent('auth_password_change_submitted', { surface: 'settings' });
      await changePasswordGateway(normalizedEmail, currentPassword, newPassword);
      clearChangePasswordForm();
      setShowChangePasswordSheet(false);
      trackUserEvent('auth_password_change_succeeded', { surface: 'settings' });
      Alert.alert('Password changed', 'Your password has been updated. Use the new password the next time you sign in.');
    } catch (err) {
      trackUserEvent('auth_password_change_failed', { surface: 'settings' });
      setChangePasswordError(getPasswordChangeErrorMessage(err));
    } finally {
      setChangePasswordBusy(false);
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
      setBackupMetadata(summarizeBackupSnapshot(snapshot));
      setBackupMetadataError(null);
      Alert.alert('Backup saved', `Cloud backup created at ${new Date(snapshot.capturedAt).toLocaleString()}.`);
    } catch (err) {
      Alert.alert('Backup failed', err instanceof Error ? err.message : 'Could not create a cloud backup.');
    } finally {
      setBackupBusy(false);
    }
  };

  const restoreAfterConfirmation = async () => {
    setBackupBusy(true);
    try {
      await restoreLatestCloudBackup();
      Alert.alert('Backup restored', 'Your latest cloud backup replaced the current cloud and device data successfully.');
      setShowBackupSheet(false);
    } catch (err) {
      Alert.alert('Restore failed', err instanceof Error ? err.message : 'Could not restore a cloud backup.');
    } finally {
      setBackupBusy(false);
    }
  };

  const handleCloudRestore = async () => {
    if (backupBusy) {
      return;
    }

    setBackupBusy(true);
    const metadata = await loadBackupMetadata();
    setBackupBusy(false);

    if (!metadata) {
      Alert.alert('Latest backup unavailable', backupMetadataError ?? 'Could not load the latest backup details.');
      return;
    }

    Alert.alert('Restore this backup?', buildBackupConfirmationMessage(metadata), [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore', style: 'destructive', onPress: () => void restoreAfterConfirmation() },
    ]);
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
      const result = await backendApi.deleteAccount();
      if (!result.deleted || !result.certificate?.zeroResidue) {
        throw new Error(
          result.operation.recoveryAction ?? `Deletion is ${result.operation.status}; your local session was preserved.`,
        );
      }
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
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 160 }} showsVerticalScrollIndicator={true}>
        <SettingsSubsection title="Account" description="Manage the identity and sign-in method for your MoneyKai account.">
          <Card>
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
          <Card style={{ marginTop: Spacing.sm }}>
            <SettingItem
              icon="lock-reset"
              iconColor="#0F766E"
              iconBg="#DDF7F1"
              title="Password & sign-in"
              subtitle={user?.auth_provider === 'google' ? 'You sign in securely with Google' : 'Update your password from Settings'}
              onPress={openChangePasswordSheet}
            />
          </Card>
        </SettingsSubsection>

        <SettingsSubsection title="Connected accounts" description="Choose which trusted services can link to your MoneyKai workspace.">
          <GmailConnectionCard />
        </SettingsSubsection>

        <SettingsSubsection title="Preferences" description="Set how MoneyKai displays information and communicates with you.">
          <Card>
            <SettingItem
              icon="currency-usd"
              iconColor="#707070"
              iconBg="#F1F1F1"
              title="Display Currency"
              subtitle={`${currency} (${currencySymbol}) from INR${exchangeRatesUpdatedAt ? `, rates ${new Date(exchangeRatesUpdatedAt).toLocaleDateString()}` : ''}`}
              onPress={() => setShowCurrencyPicker(true)}
            />
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
        </SettingsSubsection>

        <SettingsSubsection title="Data & privacy" description="Control copies of your data, your privacy information, and account removal.">
          <Card>
            <SettingItem icon="download-outline" iconColor="#111111" iconBg="#F4F4F4" title="Export Data" subtitle="Download transactions as Word, Excel, or PDF tables" onPress={() => setShowExportSheet(true)} />
            <SettingItem icon="cloud-upload-outline" iconColor="#2B2B2B" iconBg="#F2F2F2" title="Cloud backups" subtitle="Save to or restore a cloud backup" onPress={() => setShowBackupSheet(true)} />
            <SettingItem icon="shield-lock-outline" iconColor="#444444" iconBg="#ECECEC" title="Privacy Policy" subtitle="Open the privacy policy" onPress={handlePrivacy} />
            <SettingItem icon="delete-outline" iconColor={colors.emergency} iconBg={colors.emergencyBg} title="Delete Account" subtitle="Permanently remove your account and stored data" onPress={() => setShowDeleteAccountSheet(true)} />
          </Card>
        </SettingsSubsection>

        <SettingsSubsection title="Help & about" description="Find support, share feedback, and view the app version.">
          <Card>
            <SettingItem icon="information-outline" iconColor="#6B7280" iconBg="#F3F3F3" title="Version" subtitle="MoneyKai v1.0.0" />
            <SettingItem icon="star-outline" iconColor="#5A5A5A" iconBg="#EFEFEF" title="Rate the App" onPress={handleRate} />
            <SettingItem icon="help-circle-outline" iconColor="#707070" iconBg="#F1F1F1" title="Help & Support" subtitle="Email support or report a bug" onPress={handleSupport} />
          </Card>
        </SettingsSubsection>

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
        visible={showExportSheet}
        title="Export transactions"
        subtitle="Choose a table format for your MoneyKai transaction data."
        onClose={() => setShowExportSheet(false)}
        footer={<Button title="Cancel" onPress={() => setShowExportSheet(false)} variant="outline" />}
      >
        <View style={{ gap: Spacing.sm }}>
          <ExportFormatOption
            icon="file-word-outline"
            title="Word document"
            description="Downloads a .doc file with transactions arranged in a clean table."
            onPress={() => void handleExport('word')}
          />
          <ExportFormatOption
            icon="microsoft-excel"
            title="Excel workbook"
            description="Downloads an .xls table that opens in Excel or spreadsheet apps."
            onPress={() => void handleExport('excel')}
          />
          <ExportFormatOption
            icon="file-pdf-box"
            title="PDF"
            description="Opens a print-ready table. Choose Save as PDF in the browser print dialog."
            onPress={() => void handleExport('pdf')}
          />
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary, lineHeight: 18 }}>
            {transactions.length} transactions available for export.
          </Text>
        </View>
      </ModalSheet>

      <ModalSheet
        visible={showCurrencyPicker}
        title="Display currency"
        subtitle="MoneyKai stores amounts in INR and converts displayed values with live cached rates."
        onClose={() => (currencyBusy ? undefined : setShowCurrencyPicker(false))}
        footer={<Button title="Cancel" onPress={() => setShowCurrencyPicker(false)} variant="outline" disabled={currencyBusy} />}
      >
        <View style={{ gap: Spacing.sm }}>
          {exchangeRateError ? (
            <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
              Live rates could not refresh last time. MoneyKai will use the latest cached rate.
            </Text>
          ) : null}
          {CURRENCY_OPTIONS.map((option) => (
            <CurrencyOption
              key={option.code}
              option={option}
              active={currency === option.code}
              disabled={currencyBusy}
              onPress={() => void handleCurrencySelect(option)}
            />
          ))}
        </View>
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
            <Button title="Back Up Now" onPress={handleCloudBackup} loading={backupBusy} disabled={!backupConfigured} />
            <Button title="Restore Latest Backup" onPress={handleCloudRestore} variant="outline" loading={backupBusy} disabled={!backupConfigured} />
          </View>
        }
      >
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
            Cloud backups store your current transactions, linked accounts, notes, groups, challenges, badges, budget, and settings in Firebase so you can restore them on another device.
          </Text>
          <View style={{ padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.borderLight, gap: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <MaterialCommunityIcons name="cloud-search-outline" size={18} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Latest available backup
              </Text>
            </View>
            {backupMetadataLoading ? (
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
                Checking the latest cloud backup...
              </Text>
            ) : backupMetadata ? (
              <View style={{ gap: Spacing.xs }}>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
                  Created {formatBackupDateTime(backupMetadata.capturedAt)} for {backupMetadata.accountName || backupMetadata.accountEmail}
                </Text>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
                  {formatBackupCount(backupMetadata.transactionCount, 'transaction')}, {formatBackupCount(backupMetadata.linkedAccountCount, 'linked account')}, {formatBackupCount(backupMetadata.noteCount, 'note')}, {formatBackupCount(backupMetadata.groupCount, 'group')}, and {formatBackupCount(backupMetadata.challengeCount, 'savings goal')}
                </Text>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
                  Budget {formatCurrency(backupMetadata.monthlyAllowance, backupMetadata.currency, true)} | Income {formatCurrency(backupMetadata.totalIncome, backupMetadata.currency, true)} | Expenses {formatCurrency(backupMetadata.totalExpense, backupMetadata.currency, true)} | v{backupMetadata.version}
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: Typography.fontSize.xs, color: backupMetadataError ? colors.emergency : colors.textSecondary, lineHeight: 18 }}>
                {backupMetadataError ?? 'No cloud backup details loaded yet.'}
              </Text>
            )}
            <Button
              title="Refresh Details"
              onPress={() => void loadBackupMetadata()}
              variant="ghost"
              size="sm"
              loading={backupMetadataLoading}
              disabled={!backupConfigured}
            />
          </View>
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
        visible={showChangePasswordSheet}
        title="Change password"
        subtitle="Confirm your current password, then choose a new password for MoneyKai."
        onClose={closeChangePasswordSheet}
        footer={
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
            <Button title="Cancel" onPress={closeChangePasswordSheet} variant="outline" style={{ flex: 1 }} disabled={changePasswordBusy} />
            <Button title="Update Password" onPress={handleChangePassword} loading={changePasswordBusy} style={{ flex: 1 }} disabled={!user?.email || user.auth_provider === 'google'} />
          </View>
        }
      >
        <View style={{ gap: Spacing.md }}>
          {changePasswordError ? (
            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.emergency, lineHeight: 20 }}>
              {changePasswordError}
            </Text>
          ) : null}
          <Input
            label="Current password"
            placeholder="Enter your current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            icon="lock-outline"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            maxLength={128}
            editable={!changePasswordBusy}
            testID="change-password-current"
          />
          <Input
            label="New password"
            placeholder="Use 8–128 characters"
            value={newPassword}
            onChangeText={setNewPassword}
            icon="lock-plus-outline"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={128}
            editable={!changePasswordBusy}
            testID="change-password-new"
          />
          <Input
            label="Confirm new password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            icon="lock-check-outline"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            maxLength={128}
            editable={!changePasswordBusy}
            testID="change-password-confirm"
          />
          <View style={{ padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: `${colors.primary}22` }}>
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary, marginBottom: 4 }}>
              Secure confirmation
            </Text>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
              MoneyKai verifies your current password before saving the new one. Passwords are never stored in MoneyKai settings, and this protected action is rate-limited.
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
