import React, { useEffect, useMemo, useState } from 'react';
import { Alert, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { getDraftCategoryOptions } from '@/services/captureCategoryRules';
import { importRecentSmsTransactionsFromInbox } from '@/services/autoCaptureService';
import { requestNativeSmsPermission } from '@/services/nativeCaptureBridge';
import { isNativeSmsResearchBuildEnabled } from '@/config/environment';
import { MonitoredAccountCard } from '@/components/capture/MonitoredAccountCard';
import { SmsDiscoveryMessageDialog } from '@/components/capture/SmsDiscoveryMessageDialog';
import { SmsImportProgressSheet } from '@/components/capture/SmsImportProgressSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { getCategoryById } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatCurrency';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import type { MonitoredAccount } from '@/types/capture';
import type { SmsImportProgress } from '@/types/smsImport';

const iconByType: Record<string, string> = {
  budget: 'wallet-outline',
  transaction: 'cash-plus',
  challenge: 'trophy-outline',
  backup: 'cloud-check-outline',
  system: 'bell-outline',
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const captureDrafts = useCaptureStore((s) => s.drafts);
  const monitoredAccounts = useCaptureStore((s) => s.monitoredAccounts);
  const approveMonitoredAccount = useCaptureStore((s) => s.approveMonitoredAccount);
  const declineMonitoredAccount = useCaptureStore((s) => s.declineMonitoredAccount);
  const pauseMonitoredAccount = useCaptureStore((s) => s.pauseMonitoredAccount);
  const resumeMonitoredAccount = useCaptureStore((s) => s.resumeMonitoredAccount);
  const smsImportRangeId = useCaptureStore((s) => s.settings.smsImportRangeId);
  const confirmDraft = useCaptureStore((s) => s.confirmDraft);
  const ignoreDraft = useCaptureStore((s) => s.ignoreDraft);
  const [activeSection, setActiveSection] = useState<'drafts' | 'notifications'>('drafts');
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);
  const [selectedCategoryByDraft, setSelectedCategoryByDraft] = useState<Record<string, string>>({});
  const [messageAccount, setMessageAccount] = useState<MonitoredAccount | undefined>();
  const [isSmsImporting, setIsSmsImporting] = useState(false);
  const [smsImportProgress, setSmsImportProgress] = useState<SmsImportProgress | undefined>();
  const [showSmsImportProgress, setShowSmsImportProgress] = useState(false);
  const pendingDrafts = useMemo(() => captureDrafts.filter((draft) => draft.status === 'pending'), [captureDrafts]);
  const pendingAccounts = useMemo(
    () => monitoredAccounts.filter((account) => account.status === 'pending'),
    [monitoredAccounts]
  );
  const visibleMonitoredAccounts = useMemo(
    () => monitoredAccounts.filter((account) => account.status !== 'pending'),
    [monitoredAccounts]
  );
  const hasDraftContent = pendingAccounts.length > 0 || pendingDrafts.length > 0 || visibleMonitoredAccounts.length > 0;
  const hasNotificationContent = notificationsEnabled && notifications.length > 0;
  const currentSectionHasContent = activeSection === 'drafts' ? hasDraftContent : hasNotificationContent;
  const headerSubtitle = useMemo(() => {
    if (activeSection === 'drafts' && pendingAccounts.length > 0) {
      return `${pendingAccounts.length} bank account${pendingAccounts.length === 1 ? '' : 's'} waiting for monitoring approval`;
    }
    if (activeSection === 'drafts' && pendingDrafts.length > 0) {
      return `${pendingDrafts.length} captured draft${pendingDrafts.length === 1 ? '' : 's'} waiting for review`;
    }
    if (activeSection === 'drafts') return 'Approve drafts and choose categories';
    return notificationsEnabled ? 'Recent activity and alerts' : 'Notifications are disabled';
  }, [activeSection, notificationsEnabled, pendingAccounts.length, pendingDrafts.length]);

  const importAfterApproval = async () => {
    if (!isNativeSmsResearchBuildEnabled()) return;

    setIsSmsImporting(true);
    setShowSmsImportProgress(true);
    setSmsImportProgress(undefined);
    try {
      const permissionStatus = await requestNativeSmsPermission();
      if (permissionStatus !== 'granted') {
        Alert.alert('SMS permission needed', 'Grant Android SMS access from Auto Capture to import this account.');
        return;
      }

      const summary = await importRecentSmsTransactionsFromInbox(smsImportRangeId, setSmsImportProgress);
      if (summary.status === 'permission_denied' || summary.status === 'unsupported' || summary.status === 'error') {
        Alert.alert('SMS import paused', summary.message ?? 'MoneyKai could not import SMS after approval.');
        return;
      }

      Alert.alert(
        summary.draftedCount > 0 ? 'SMS drafts imported' : 'Monitoring enabled',
        summary.draftedCount > 0
          ? `${summary.draftedCount} draft${summary.draftedCount === 1 ? '' : 's'} are ready for review.`
          : 'MoneyKai will monitor this account for future approved SMS captures.'
      );
    } finally {
      setIsSmsImporting(false);
    }
  };

  const handleApproveAccount = (account: MonitoredAccount) => {
    approveMonitoredAccount(account.id);
    void importAfterApproval();
  };

  const handleResumeAccount = (account: MonitoredAccount) => {
    resumeMonitoredAccount(account.id);
    void importAfterApproval();
  };

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <View style={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.sm }}>
        <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
          {headerSubtitle}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
        {(['drafts', 'notifications'] as const).map((section) => {
          const active = activeSection === section;
          const count =
            section === 'drafts'
              ? pendingAccounts.length + visibleMonitoredAccounts.length + pendingDrafts.length
              : notifications.length;
          return (
            <TouchableOpacity
              key={section}
              onPress={() => setActiveSection(section)}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: BorderRadius.full,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: Spacing.sm,
                backgroundColor: active ? colors.primary : colors.card,
                borderWidth: active ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                style={{ fontSize: Typography.fontSize.sm, lineHeight: 18, fontFamily: Typography.fontFamily.semiBold, color: active ? colors.textInverse : colors.textSecondary }}
              >
                {section === 'drafts' ? `Drafts (${count})` : `Notifications (${count})`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!currentSectionHasContent ? (
        <EmptyState
          icon={activeSection === 'drafts' ? 'receipt-text-outline' : 'bell-outline'}
          title={activeSection === 'drafts' ? 'No drafts' : notificationsEnabled ? 'No notifications yet' : 'Notifications off'}
          message={
            activeSection === 'drafts'
              ? 'Captured transactions and bank account approvals will appear here.'
              : notificationsEnabled
              ? 'Captured transaction drafts and app alerts will appear here.'
              : 'Captured transaction drafts still appear here when they need review.'
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: Spacing['2xl'] }}
          showsVerticalScrollIndicator={false}
        >
          {activeSection === 'drafts' && pendingAccounts.length > 0 ? (
            <View style={{ marginBottom: Spacing.lg }}>
              <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
                Bank Accounts Found
              </Text>
              {pendingAccounts.map((account) => (
                <MonitoredAccountCard
                  key={account.id}
                  account={account}
                  onApprove={handleApproveAccount}
                  onDecline={(item) => declineMonitoredAccount(item.id)}
                  onShowMessage={setMessageAccount}
                />
              ))}
            </View>
          ) : null}

          {activeSection === 'drafts' && visibleMonitoredAccounts.length > 0 ? (
            <View style={{ marginBottom: Spacing.lg }}>
              <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
                Monitored SMS Accounts
              </Text>
              {visibleMonitoredAccounts.map((account) => (
                <MonitoredAccountCard
                  key={account.id}
                  account={account}
                  onPause={(item) => pauseMonitoredAccount(item.id)}
                  onResume={handleResumeAccount}
                  onDecline={(item) => declineMonitoredAccount(item.id)}
                  onShowMessage={setMessageAccount}
                />
              ))}
            </View>
          ) : null}

          {activeSection === 'drafts' && pendingDrafts.length > 0 ? (
            <View style={{ marginBottom: Spacing.lg }}>
              <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
                Drafts
              </Text>
              {pendingDrafts.map((draft) => {
                const isExpanded = expandedDraftId === draft.id;
                const categories = getDraftCategoryOptions(draft);
                const selectedCategoryId = selectedCategoryByDraft[draft.id] ?? draft.category ?? draft.suggestedCategory;
                const selectedCategory = selectedCategoryId ? getCategoryById(selectedCategoryId) : undefined;

                const handleApprove = () => {
                  if (!selectedCategoryId) {
                    setExpandedDraftId(draft.id);
                    Alert.alert('Category needed', 'Choose a category before approving this captured draft.');
                    return;
                  }

                  const confirmed = confirmDraft(draft.id, selectedCategoryId);
                  if (!confirmed) {
                    Alert.alert('Could not approve', 'Set a monthly budget before confirming captured transactions.');
                    return;
                  }

                  setExpandedDraftId(null);
                  setSelectedCategoryByDraft((current) => {
                    const next = { ...current };
                    delete next[draft.id];
                    return next;
                  });
                };

                const handleDecline = () => {
                  ignoreDraft(draft.id);
                  setExpandedDraftId(null);
                  setSelectedCategoryByDraft((current) => {
                    const next = { ...current };
                    delete next[draft.id];
                    return next;
                  });
                };

                return (
                  <View
                    key={draft.id}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: BorderRadius.lg,
                      padding: Spacing.base,
                      marginBottom: Spacing.md,
                      borderWidth: 1,
                      borderColor: selectedCategory?.color ? `${selectedCategory.color}24` : colors.borderLight,
                      ...Shadows.sm,
                      shadowColor: colors.shadowColor,
                    }}
                  >
                    <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' }}>
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: BorderRadius.sm,
                          backgroundColor: selectedCategory?.colorLight ?? colors.surface,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: colors.borderLight,
                        }}
                      >
                        <MaterialCommunityIcons
                          name={(selectedCategory?.icon ?? 'receipt-text-outline') as any}
                          size={20}
                          color={selectedCategory?.color ?? colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                          {draft.description}
                        </Text>
                        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 18, marginTop: 2 }}>
                          {draft.type === 'expense' ? '-' : '+'}
                          {formatCurrency(draft.amount)} | {draft.transaction_date}
                        </Text>
                        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary, marginTop: 3 }}>
                          {selectedCategory?.name ? `Suggested: ${selectedCategory.name}` : 'Category needed'} | {draft.captureSource.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.82}
                      onPress={() => setExpandedDraftId(isExpanded ? null : draft.id)}
                      style={{
                        marginTop: Spacing.md,
                        minHeight: 42,
                        borderRadius: BorderRadius.md,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: Spacing.md,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                        {isExpanded ? 'Hide review actions' : 'Approve or decline'}
                      </Text>
                      <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {isExpanded ? (
                      <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
                        <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
                          Category
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                          {categories.map((category) => {
                            const active = selectedCategoryId === category.id;
                            return (
                              <TouchableOpacity
                                key={category.id}
                                activeOpacity={0.82}
                                onPress={() =>
                                  setSelectedCategoryByDraft((current) => ({ ...current, [draft.id]: category.id }))
                                }
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  gap: 6,
                                  paddingHorizontal: Spacing.md,
                                  paddingVertical: Spacing.sm,
                                  borderRadius: BorderRadius.full,
                                  backgroundColor: active ? category.colorLight : colors.surface,
                                  borderWidth: 1,
                                  borderColor: active ? category.color : colors.border,
                                }}
                              >
                                <MaterialCommunityIcons name={category.icon as any} size={15} color={category.color} />
                                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
                                  {category.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                          <TouchableOpacity
                            activeOpacity={0.84}
                            onPress={handleDecline}
                            style={{
                              flex: 1,
                              minHeight: 44,
                              borderRadius: BorderRadius.md,
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: colors.emergencyBg,
                              borderWidth: 1,
                              borderColor: `${colors.emergency}44`,
                            }}
                          >
                            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.emergency }}>
                              Decline
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            activeOpacity={0.84}
                            onPress={handleApprove}
                            style={{
                              flex: 1,
                              minHeight: 44,
                              borderRadius: BorderRadius.md,
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: colors.primary,
                            }}
                          >
                            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                              Approve
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}

          {activeSection === 'notifications' && notificationsEnabled ? notifications.map((notification, index) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => {
                if (notification.actionRoute) {
                  router.push(notification.actionRoute as any);
                }
              }}
              style={{
                backgroundColor: colors.card,
                borderRadius: BorderRadius.lg,
                padding: Spacing.base,
                marginBottom: Spacing.md,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: Spacing.md,
                ...Shadows.sm,
                shadowColor: colors.shadowColor,
                borderLeftWidth: 3,
                borderLeftColor: index === 0 ? colors.primary : 'transparent',
              }}
            >
              <View style={{
                width: 42,
                height: 42,
                borderRadius: BorderRadius.sm,
                backgroundColor: notification.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MaterialCommunityIcons
                  name={(notification.icon || iconByType[notification.type] || 'bell-outline') as any}
                  size={20}
                  color={notification.iconColor}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: 4 }}>
                  {notification.title}
                </Text>
                <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 18 }}>
                  {notification.body}
                </Text>
                <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 6 }}>
                  {new Date(notification.createdAt).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          )) : null}
        </ScrollView>
      )}
      <SmsDiscoveryMessageDialog
        visible={Boolean(messageAccount)}
        account={messageAccount}
        onClose={() => setMessageAccount(undefined)}
      />
      <SmsImportProgressSheet
        visible={showSmsImportProgress}
        progress={smsImportProgress}
        onClose={() => {
          if (!isSmsImporting) {
            setShowSmsImportProgress(false);
          }
        }}
      />
    </SafeAreaView>
  );
}
