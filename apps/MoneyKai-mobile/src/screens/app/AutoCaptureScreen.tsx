import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { isNativeSmsResearchBuildEnabled, isSmsResearchBuildEnabled } from '@/config/environment';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTheme } from '@/hooks/useTheme';
import {
  clearNativeCaptureQueue,
  getNativeCaptureStatus,
  openNativeCaptureSettings,
  requestNativeSmsPermission,
  setNativeApprovedSmsAccounts,
  setNativeCaptureSourcesEnabled,
} from '@/services/nativeCaptureBridge';
import {
  ingestSmsCapture,
  importRecentSmsTransactionsFromInbox,
} from '@/services/autoCaptureService';
import { SMS_IMPORT_RANGE_OPTIONS } from '@/constants/smsImportRanges';
import { formatMonitoredAccountLabel } from '@/services/captureAccountIdentifier';
import { getDraftCategoryOptions } from '@/services/captureCategoryRules';
import { Spacing } from '@/constants/theme';
import { titleCase } from '@/utils/labels';
import type { SmsImportRangeId } from '@/types/smsImport';
import { createAppScreenStyles } from './screenStyles';

const buildImportSummary = (summary: Awaited<ReturnType<typeof importRecentSmsTransactionsFromInbox>>) => {
  if (summary.message) {
    return summary.message;
  }

  if (summary.status === 'needs_account_approval') {
    return 'Approve the discovered bank accounts below, then import again.';
  }

  if (summary.status === 'imported') {
    return `${summary.confirmedCount} confirmed, ${summary.pendingReviewCount} pending review, ${summary.duplicateCount} duplicate.`;
  }

  return titleCase(summary.status.replace(/_/g, ' '));
};

export function AutoCaptureScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const settings = useCaptureStore((state) => state.settings);
  const drafts = useCaptureStore((state) => state.drafts);
  const merchantRules = useCaptureStore((state) => state.merchantRules);
  const monitoredAccounts = useCaptureStore((state) => state.monitoredAccounts);
  const setAutoCaptureEnabled = useCaptureStore((state) => state.setAutoCaptureEnabled);
  const setNotificationCaptureEnabled = useCaptureStore((state) => state.setNotificationCaptureEnabled);
  const setSmsResearchModeEnabled = useCaptureStore((state) => state.setSmsResearchModeEnabled);
  const setNotificationAccessStatus = useCaptureStore((state) => state.setNotificationAccessStatus);
  const setSmsAccessStatus = useCaptureStore((state) => state.setSmsAccessStatus);
  const approveMonitoredAccount = useCaptureStore((state) => state.approveMonitoredAccount);
  const declineMonitoredAccount = useCaptureStore((state) => state.declineMonitoredAccount);
  const unselectMonitoredAccount = useCaptureStore((state) => state.unselectMonitoredAccount);
  const confirmDraft = useCaptureStore((state) => state.confirmDraft);
  const ignoreDraft = useCaptureStore((state) => state.ignoreDraft);
  const clearCaptureInbox = useCaptureStore((state) => state.clearCaptureInbox);
  const [nativeReady, setNativeReady] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [isImportingSms, setIsImportingSms] = useState(false);
  const [smsImportRange, setSmsImportRange] = useState<SmsImportRangeId>('1_month');
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const [draftCategorySelections, setDraftCategorySelections] = useState<Record<string, string>>({});

  const pendingDrafts = drafts.filter((draft) => draft.status === 'pending');
  const pendingAccounts = monitoredAccounts.filter((account) => account.status === 'pending');
  const approvedAccounts = monitoredAccounts.filter((account) => account.status === 'approved');
  const selectedRange = SMS_IMPORT_RANGE_OPTIONS.find((range) => range.id === smsImportRange) ?? SMS_IMPORT_RANGE_OPTIONS[1];
  const smsResearchAvailable = isSmsResearchBuildEnabled();
  const nativeSmsAvailable = isNativeSmsResearchBuildEnabled();

  useEffect(() => {
    setDraftCategorySelections((current) => {
      const next = { ...current };
      pendingDrafts.forEach((draft) => {
        if (!next[draft.id] && draft.category) {
          next[draft.id] = draft.category;
        }
      });
      Object.keys(next).forEach((draftId) => {
        if (!pendingDrafts.some((draft) => draft.id === draftId)) {
          delete next[draftId];
        }
      });
      return next;
    });
  }, [drafts]);

  useEffect(() => {
    void getNativeCaptureStatus().then((status) => {
      setNativeReady(status.nativeModuleAvailable);
      setNotificationAccessStatus(status.notificationAccess);
      setSmsAccessStatus(status.smsInboxAccess === 'granted' ? 'granted' : status.smsAccess);
    });
  }, [setNotificationAccessStatus, setSmsAccessStatus]);

  const syncNativeSources = async (autoEnabled: boolean, notificationEnabled: boolean, smsEnabled: boolean) => {
    await setNativeCaptureSourcesEnabled({
      notificationEnabled: autoEnabled && notificationEnabled,
      smsEnabled: autoEnabled && nativeSmsAvailable && smsEnabled,
    });
  };

  const syncApprovedSmsAccounts = async () => {
    const approvedAccountIds = useCaptureStore
      .getState()
      .monitoredAccounts.filter((account) => account.status === 'approved')
      .map((account) => account.id);
    await setNativeApprovedSmsAccounts(approvedAccountIds);
  };

  const toggleAutoCapture = async (enabled: boolean) => {
    setAutoCaptureEnabled(enabled);
    await syncNativeSources(enabled, settings.notificationCaptureEnabled, settings.smsResearchModeEnabled);
  };

  const toggleNotificationCapture = async (enabled: boolean) => {
    setNotificationCaptureEnabled(enabled);
    await syncNativeSources(settings.autoCaptureEnabled, enabled, settings.smsResearchModeEnabled);
  };

  const toggleSmsResearch = async (enabled: boolean) => {
    if (enabled && !smsResearchAvailable) {
      Alert.alert('SMS research unavailable', 'This APK was not built with SMS Research Mode enabled.');
      return;
    }

    if (enabled && nativeSmsAvailable) {
      const permission = await requestNativeSmsPermission();
      setSmsAccessStatus(permission);
      if (permission !== 'granted') {
        Alert.alert('SMS access needed', 'Allow SMS access to import and automatically capture bank transaction SMS.');
        return;
      }
    }

    setSmsResearchModeEnabled(enabled);
    await syncNativeSources(settings.autoCaptureEnabled, settings.notificationCaptureEnabled, enabled);
  };

  const pasteSms = () => {
    if (!smsText.trim()) {
      Alert.alert('Paste SMS text', 'Add a bank or payment SMS to parse.');
      return;
    }
    const result = ingestSmsCapture({ body: smsText });
    setSmsText('');
    Alert.alert('SMS processed', result.reason ?? titleCase(result.status));
  };

  const importSmsInbox = async (rangeId: SmsImportRangeId = smsImportRange) => {
    setIsImportingSms(true);
    try {
      const permission = await requestNativeSmsPermission();
      setSmsAccessStatus(permission);
      if (permission !== 'granted') {
        Alert.alert('SMS access needed', 'Allow SMS inbox access, then try importing again.');
        return;
      }

      setAutoCaptureEnabled(true);
      setSmsResearchModeEnabled(true);
      await syncNativeSources(true, settings.notificationCaptureEnabled, true);
      await syncApprovedSmsAccounts();
      const summary = await importRecentSmsTransactionsFromInbox(rangeId);
      Alert.alert('SMS import complete', buildImportSummary(summary));
    } finally {
      setIsImportingSms(false);
    }
  };

  const approveAndImportAccount = async (accountId: string) => {
    approveMonitoredAccount(accountId);
    await syncApprovedSmsAccounts();
    await importSmsInbox(smsImportRange);
  };

  const declineAndSyncAccount = async (accountId: string) => {
    declineMonitoredAccount(accountId);
    await syncApprovedSmsAccounts();
  };

  const unselectAndSyncAccount = async (accountId: string) => {
    unselectMonitoredAccount(accountId);
    await syncApprovedSmsAccounts();
  };

  const showAccountSample = (message?: string) => {
    Alert.alert('Identified from SMS', message || 'MoneyKai found this bank account from matching SMS metadata.');
  };

  const confirmDraftWithSelectedCategory = (draftId: string) => {
    const draft = drafts.find((item) => item.id === draftId);
    const selectedCategory = draftCategorySelections[draftId] ?? draft?.category;
    if (!selectedCategory) {
      Alert.alert('Choose category', 'Select a category before confirming this transaction.');
      return;
    }
    confirmDraft(draftId, selectedCategory);
  };

  const formatMoney = (value: number) => `${currencySymbol}${value.toLocaleString('en-IN')}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <ScreenBackButton />
          <Text style={styles.title}>Review captured drafts</Text>
          <Text style={styles.subtitle}>SMS and notification captures stay as drafts until you review them.</Text>
        </View>

        <View style={styles.panel}>
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.muted}>Pending</Text>
              <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{pendingDrafts.length}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.muted}>Learned rules</Text>
              <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{merchantRules.length}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.muted}>SMS access</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.value, { color: settings.smsAccessStatus === 'granted' ? colors.success : colors.textPrimary }]}>
                {titleCase(settings.smsAccessStatus)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.muted}>Native module</Text>
            <Text style={{ ...styles.value, color: nativeReady ? colors.success : colors.error }} numberOfLines={1} adjustsFontSizeToFit>
              {nativeReady ? 'Ready' : 'Unavailable'}
            </Text>
          </View>
          <View style={[styles.row, { marginTop: Spacing.md }]}>
            <Text style={styles.muted}>Auto capture</Text>
            <Switch
              value={settings.autoCaptureEnabled}
              onValueChange={toggleAutoCapture}
              trackColor={{ false: colors.border, true: colors.primaryBg }}
              thumbColor={settings.autoCaptureEnabled ? colors.primary : colors.textTertiary}
            />
          </View>
          <View style={[styles.row, { marginTop: Spacing.md }]}>
            <Text style={styles.muted}>Notification capture</Text>
            <Switch
              value={settings.notificationCaptureEnabled}
              onValueChange={toggleNotificationCapture}
              trackColor={{ false: colors.border, true: colors.primaryBg }}
              thumbColor={settings.notificationCaptureEnabled ? colors.primary : colors.textTertiary}
            />
          </View>
          <View style={[styles.row, { marginTop: Spacing.md }]}>
            <Text style={styles.muted}>SMS research capture</Text>
            <Switch
              value={settings.smsResearchModeEnabled}
              onValueChange={toggleSmsResearch}
              trackColor={{ false: colors.border, true: colors.primaryBg }}
              thumbColor={settings.smsResearchModeEnabled ? colors.primary : colors.textTertiary}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
            <Button title="Android access" onPress={() => void openNativeCaptureSettings()} size="sm" style={{ flex: 1 }} />
            <Button title="Clear queue" onPress={() => void clearNativeCaptureQueue()} variant="outline" size="sm" style={{ flex: 1 }} />
          </View>
        </View>

        {nativeSmsAvailable && (
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>SMS inbox import</Text>
            <Text style={[styles.muted, { marginBottom: Spacing.md }]}>
              Choose how much SMS history to parse, approve each bank account once, then review every transaction category.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Choose SMS import range"
              activeOpacity={0.75}
              onPress={() => setShowRangeMenu((value) => !value)}
              style={{
                alignItems: 'center',
                borderColor: colors.border,
                borderRadius: 12,
                borderWidth: 1,
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: Spacing.md,
                minHeight: 46,
                paddingHorizontal: Spacing.md,
              }}
            >
              <Text style={styles.value}>Parse {selectedRange.label}</Text>
              <MaterialCommunityIcons name={showRangeMenu ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textTertiary} />
            </TouchableOpacity>
            {showRangeMenu && (
              <View style={{ borderColor: colors.borderLight, borderRadius: 12, borderWidth: 1, marginBottom: Spacing.md, overflow: 'hidden' }}>
                {SMS_IMPORT_RANGE_OPTIONS.map((range) => (
                  <TouchableOpacity
                    key={range.id}
                    accessibilityRole="button"
                    onPress={() => {
                      setSmsImportRange(range.id);
                      setShowRangeMenu(false);
                    }}
                    style={{
                      backgroundColor: range.id === smsImportRange ? colors.primaryBg : colors.card,
                      borderTopColor: colors.borderLight,
                      borderTopWidth: range.id === SMS_IMPORT_RANGE_OPTIONS[0].id ? 0 : 1,
                      padding: Spacing.md,
                    }}
                  >
                    <Text style={[styles.value, { color: range.id === smsImportRange ? colors.primary : colors.textPrimary }]}>
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Button
              title={isImportingSms ? 'Importing...' : 'Import recent SMS'}
              onPress={() => void importSmsInbox()}
              icon="message-processing-outline"
              loading={isImportingSms}
              disabled={isImportingSms}
            />
          </View>
        )}

        {smsResearchAvailable && (
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Paste SMS research</Text>
            <Input
              value={smsText}
              onChangeText={setSmsText}
              placeholder="Paste a bank/payment SMS for manual parsing"
              icon="message-text-outline"
              multiline
              numberOfLines={4}
            />
            <Button title="Parse SMS" onPress={pasteSms} icon="text-search" />
          </View>
        )}

        {monitoredAccounts.length > 0 && (
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>SMS accounts</Text>
            {pendingAccounts.length === 0 && approvedAccounts.length === 0 && (
              <Text style={styles.emptyText}>No active SMS accounts.</Text>
            )}
            {pendingAccounts.map((account) => (
              <View key={account.id} style={{ marginBottom: Spacing.md }}>
                <Text style={styles.value} numberOfLines={1}>{formatMonitoredAccountLabel(account)}</Text>
                <Text style={styles.muted}>{account.sampleCount} matching SMS found. Approve to import this account.</Text>
                <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
                  <Button title="Approve" onPress={() => void approveAndImportAccount(account.id)} size="sm" style={{ flex: 1 }} />
                  <Button title="Decline" onPress={() => void declineAndSyncAccount(account.id)} variant="outline" size="sm" style={{ flex: 1 }} />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Show source SMS"
                    activeOpacity={0.75}
                    onPress={() => showAccountSample(account.sampleMessage)}
                    style={{
                      alignItems: 'center',
                      borderColor: colors.border,
                      borderRadius: 12,
                      borderWidth: 1,
                      justifyContent: 'center',
                      width: 44,
                      }}
                    >
                    <MaterialCommunityIcons name="message-text-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {approvedAccounts.map((account) => (
              <View key={account.id} style={[styles.row, { marginBottom: Spacing.sm }]}>
                <View style={{ flex: 1, minWidth: 0, paddingRight: Spacing.md }}>
                  <Text style={styles.value} numberOfLines={1}>{formatMonitoredAccountLabel(account)}</Text>
                  <Text style={styles.muted}>Approved for SMS auto parsing.</Text>
                </View>
                <Button title="Unselect" onPress={() => void unselectAndSyncAccount(account.id)} variant="outline" size="sm" />
              </View>
            ))}
          </View>
        )}

        {pendingDrafts.length === 0 && (
          <View style={[styles.panel, { alignItems: 'center', paddingVertical: Spacing['2xl'] }]}>
            <MaterialCommunityIcons name="check-decagram-outline" size={48} color={colors.primary} />
            <Text style={[styles.value, { marginTop: Spacing.md, textAlign: 'center' }]}>No drafts to review</Text>
            <Text style={[styles.muted, { marginTop: Spacing.sm, textAlign: 'center' }]}>
              Clean queue. Captured transactions will appear here when they need your eyes.
            </Text>
          </View>
        )}

        <View style={[styles.row, { marginBottom: Spacing.md }]}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Drafts</Text>
          <TouchableOpacity onPress={clearCaptureInbox}>
            <Text style={{ ...styles.muted, color: colors.primary }}>Clear reviewed</Text>
          </TouchableOpacity>
        </View>

        {pendingDrafts.length === 0 ? (
          <View style={styles.panel}>
            <Text style={styles.emptyText}>No pending captured drafts.</Text>
          </View>
        ) : (
          pendingDrafts.map((draft) => (
            <View key={draft.id} style={styles.panel}>
              <View style={styles.row}>
                <View style={{ flex: 1, minWidth: 0, paddingRight: Spacing.md }}>
                  <Text style={styles.value} numberOfLines={1}>{draft.description}</Text>
                  <Text style={styles.muted} numberOfLines={1}>
                    {formatMoney(draft.amount)} - {draft.category ? titleCase(draft.category) : 'Category needed'} - {titleCase(draft.captureSource)}
                  </Text>
                </View>
                <MaterialCommunityIcons name="file-document-edit-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.muted, { marginBottom: Spacing.sm }]}>Category</Text>
                  <View style={styles.chipRow}>
                    {getDraftCategoryOptions(draft).map((category) => {
                      const active = (draftCategorySelections[draft.id] ?? draft.category) === category.id;
                      return (
                        <TouchableOpacity
                          key={category.id}
                          onPress={() => setDraftCategorySelections((current) => ({ ...current, [draft.id]: category.id }))}
                          style={[styles.chip, active && styles.chipActive]}
                        >
                          <MaterialCommunityIcons
                            name={category.icon}
                            size={16}
                            color={active ? colors.textInverse : colors.textSecondary}
                          />
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{category.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
                <Button
                  title="Confirm"
                  onPress={() => confirmDraftWithSelectedCategory(draft.id)}
                  size="sm"
                  style={{ flex: 1 }}
                />
                <Button title="Ignore" onPress={() => ignoreDraft(draft.id)} variant="outline" size="sm" style={{ flex: 1 }} />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
