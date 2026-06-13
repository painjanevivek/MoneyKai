import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { Button } from '@/components/ui/Button';
import { BudgetRequiredDialog } from '@/components/ui/BudgetRequiredDialog';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { SmsImportProgressSheet } from '@/components/capture/SmsImportProgressSheet';
import { SmsImportRangeSelector } from '@/components/capture/SmsImportRangeSelector';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryById } from '@/constants/categories';
import { DEFAULT_SMS_IMPORT_RANGE_ID } from '@/constants/smsImportRanges';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { isNativeSmsResearchBuildEnabled, isSmsResearchBuildEnabled } from '@/config/environment';
import { ingestSmsCapture, importRecentSmsTransactionsFromInbox } from '@/services/autoCaptureService';
import { requestNativeSmsPermission } from '@/services/nativeCaptureBridge';
import { formatCurrency } from '@/utils/formatCurrency';
import type { CaptureSource, DraftTransaction } from '@/types/capture';
import type { SmsImportProgress } from '@/types/smsImport';

const MAX_VISIBLE_DRAFT_CARDS = 100;

const confidenceLabel = (confidence: number) => {
  if (confidence >= 0.8) return 'High confidence';
  if (confidence >= 0.55) return 'Needs a quick check';
  return 'Needs category';
};

const sourceBadgeConfig: Record<CaptureSource, { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  notification: { label: 'Notification', icon: 'bell-badge-outline' },
  sms: { label: 'SMS', icon: 'message-processing-outline' },
  aa: { label: 'Bank Sync', icon: 'bank-transfer' },
  manual: { label: 'Manual', icon: 'pencil-outline' },
};

const SourceBadge = ({ source, sourceApp }: { source: CaptureSource; sourceApp?: string }) => {
  const { colors } = useTheme();
  const config = sourceBadgeConfig[source];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 5,
        borderRadius: BorderRadius.full,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderLight,
      }}
    >
      <MaterialCommunityIcons name={config.icon} size={13} color={colors.textSecondary} />
      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
        {sourceApp ? `${config.label} | ${sourceApp}` : config.label}
      </Text>
    </View>
  );
};

const buildExplanationText = (draft: DraftTransaction) => {
  const explanation = draft.parseExplanation;
  if (!explanation) return 'MoneyKai found a transaction amount and created a review draft.';

  return [
    draft.sourceApp ? `Source: ${draft.sourceApp}` : `Source: ${draft.captureSource}`,
    explanation.matchedAmount ? `Amount: ${explanation.matchedAmount}` : undefined,
    `Merchant: ${draft.description}`,
    explanation.matchedPaymentMethod ? `Method: ${explanation.matchedPaymentMethod}` : undefined,
    explanation.matchedDirectionTerms.length > 0 ? `Direction: ${explanation.matchedDirectionTerms.join(', ')}` : undefined,
    explanation.matchedCategoryRule ? `Category: ${explanation.matchedCategoryRule}` : undefined,
    `Confidence: ${Math.round(draft.confidence * 100)}%`,
    explanation.dedupeReference ? `Reference: ${explanation.dedupeReference}` : undefined,
    draft.parseReason ? `Reason: ${draft.parseReason}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
};

const DraftCard = ({ draft, onBudgetRequired }: { draft: DraftTransaction; onBudgetRequired: () => void }) => {
  const { colors } = useTheme();
  const confirmDraft = useCaptureStore((state) => state.confirmDraft);
  const ignoreDraft = useCaptureStore((state) => state.ignoreDraft);
  const categories = draft.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const suggestedCategoryId = draft.suggestedCategory ?? draft.category;
  const selectedCategory = suggestedCategoryId ? getCategoryById(suggestedCategoryId) : undefined;

  const handleConfirm = (category: string) => {
    const confirmed = confirmDraft(draft.id, category);
    if (confirmed) {
      Alert.alert('Transaction added', 'MoneyKai added this draft to your transaction history.');
      return;
    }

    onBudgetRequired();
  };

  const handleWhyCaptured = () => {
    Alert.alert('Why captured?', buildExplanationText(draft));
  };

  return (
    <Card variant="outlined" borderRadius="md" style={{ marginBottom: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
        <View
          style={{
            width: 44,
            height: 44,
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
            size={22}
            color={selectedCategory?.color ?? colors.textSecondary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SourceBadge source={draft.captureSource} sourceApp={draft.sourceApp} />
          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            {draft.description}
          </Text>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
            {draft.type === 'expense' ? '-' : '+'}
            {formatCurrency(draft.amount)} | {draft.payment_method.toUpperCase()} | {draft.transaction_date}
          </Text>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary, marginTop: 4 }}>
            {confidenceLabel(draft.confidence)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md }}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            activeOpacity={0.85}
            onPress={() => handleConfirm(category.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              borderRadius: BorderRadius.full,
              borderWidth: 1,
              borderColor: suggestedCategoryId === category.id ? category.color : colors.border,
              backgroundColor: suggestedCategoryId === category.id ? category.colorLight : colors.surface,
            }}
          >
            <MaterialCommunityIcons name={category.icon as any} size={15} color={category.color} />
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
        {suggestedCategoryId ? (
          <Button
            title="Confirm Suggested"
            icon="check"
            onPress={() => handleConfirm(suggestedCategoryId)}
            style={{ flex: 1 }}
          />
        ) : null}
        <Button
          title="Ignore"
          icon="close"
          variant="outline"
          onPress={() => ignoreDraft(draft.id)}
          style={{ flex: 1 }}
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleWhyCaptured}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: Spacing.sm,
          alignSelf: 'flex-start',
        }}
      >
        <MaterialCommunityIcons name="information-outline" size={16} color={colors.textSecondary} />
        <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
          Why captured?
        </Text>
      </TouchableOpacity>
    </Card>
  );
};

export default function AutoCaptureScreen() {
  const { colors } = useTheme();
  const drafts = useCaptureStore((state) => state.drafts);
  const signals = useCaptureStore((state) => state.signals);
  const merchantRules = useCaptureStore((state) => state.merchantRules);
  const captureSettings = useCaptureStore((state) => state.settings);
  const smsImportRangeId = useCaptureStore((state) => state.settings.smsImportRangeId ?? DEFAULT_SMS_IMPORT_RANGE_ID);
  const setSmsImportRangeId = useCaptureStore((state) => state.setSmsImportRangeId);
  const smsResearchModeEnabled = useCaptureStore((state) => state.settings.smsResearchModeEnabled);
  const monthlyAllowance = useBudgetStore((state) => state.settings.monthly_allowance);
  const smsResearchBuildEnabled = isSmsResearchBuildEnabled();
  const nativeSmsResearchBuildEnabled = isNativeSmsResearchBuildEnabled();
  const [showSmsImport, setShowSmsImport] = useState(false);
  const [smsSender, setSmsSender] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [smsImportError, setSmsImportError] = useState<string | undefined>();
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [isSmsInboxImporting, setIsSmsInboxImporting] = useState(false);
  const [showSmsImportProgress, setShowSmsImportProgress] = useState(false);
  const [smsImportProgress, setSmsImportProgress] = useState<SmsImportProgress | undefined>();
  const pendingDrafts = useMemo(() => drafts.filter((draft) => draft.status === 'pending'), [drafts]);
  const visiblePendingDrafts = useMemo(() => pendingDrafts.slice(0, MAX_VISIBLE_DRAFT_CARDS), [pendingDrafts]);
  const recentSignals = useMemo(() => signals.slice(0, 5), [signals]);
  const hiddenNotificationSignals = useMemo(
    () =>
      signals.filter(
        (signal) =>
          signal.source === 'notification' &&
          signal.ignoreReason === 'notification content hidden by Android privacy settings'
      ),
    [signals]
  );
  const hasMonthlyBudget = monthlyAllowance > 0;
  const canPasteSms = smsResearchBuildEnabled && smsResearchModeEnabled && hasMonthlyBudget;
  const canImportSmsInbox = nativeSmsResearchBuildEnabled && canPasteSms && !isSmsInboxImporting;
  const notificationCaptureReady =
    captureSettings.autoCaptureEnabled &&
    captureSettings.notificationCaptureEnabled &&
    captureSettings.notificationAccessStatus === 'granted';
  const showCaptureSetup = pendingDrafts.length === 0 && !notificationCaptureReady;

  const resetSmsImport = () => {
    setSmsSender('');
    setSmsBody('');
    setSmsImportError(undefined);
  };

  const showBudgetRequired = () => {
    setShowBudgetDialog(true);
  };

  const handleSetBudget = () => {
    setShowBudgetDialog(false);
    router.push('/(tabs)/budget');
  };

  const handleOpenSmsImport = () => {
    if (!hasMonthlyBudget) {
      showBudgetRequired();
      return;
    }

    if (!canPasteSms) {
      Alert.alert('SMS Research Mode is off', 'Enable SMS Research Mode in Settings before importing pasted SMS text.');
      return;
    }

    resetSmsImport();
    setShowSmsImport(true);
  };

  const handleSubmitSmsImport = () => {
    if (!hasMonthlyBudget) {
      setShowSmsImport(false);
      showBudgetRequired();
      return;
    }

    const body = smsBody.trim();
    if (body.length < 12) {
      setSmsImportError('Paste a complete transaction SMS.');
      return;
    }

    const result = ingestSmsCapture({
      sender: smsSender.trim() || undefined,
      body,
      receivedAt: new Date().toISOString(),
    });

    resetSmsImport();
    setShowSmsImport(false);

    if (result.status === 'drafted') {
      Alert.alert('Draft ready', 'MoneyKai created a reviewable SMS draft.');
      return;
    }

    if (result.status === 'duplicate') {
      Alert.alert('Already captured', 'MoneyKai found an existing capture for this transaction.');
      return;
    }

    Alert.alert('Not imported', result.reason);
  };

  const handleImportRecentSmsInbox = async () => {
    if (!hasMonthlyBudget) {
      showBudgetRequired();
      return;
    }

    if (!nativeSmsResearchBuildEnabled) {
      Alert.alert('Manual SMS only', 'This release build is Play-safe and does not read your SMS inbox. Paste a transaction SMS here to create a reviewable draft.');
      return;
    }

    if (!smsResearchBuildEnabled || !smsResearchModeEnabled) {
      Alert.alert('SMS Research Mode is off', 'Enable SMS Research Mode in Settings before importing recent SMS transactions.');
      return;
    }

    setIsSmsInboxImporting(true);
    setShowSmsImportProgress(true);
    setSmsImportProgress(undefined);
    try {
      const permissionStatus = await requestNativeSmsPermission();
      if (permissionStatus !== 'granted') {
        Alert.alert('SMS permission needed', 'Grant Android SMS access to import recent bank and payment transaction messages.');
        return;
      }

      const summary = await importRecentSmsTransactionsFromInbox(smsImportRangeId, setSmsImportProgress);

      if (summary.status === 'permission_denied') {
        Alert.alert('SMS permission needed', summary.message ?? 'Android denied SMS inbox access.');
        return;
      }

      if (summary.status === 'unsupported') {
        Alert.alert('Android build required', summary.message ?? 'Install a MoneyKai Android development build to import SMS history.');
        return;
      }

      if (summary.status === 'error') {
        Alert.alert('Import failed', summary.message ?? 'MoneyKai could not import SMS messages right now.');
        return;
      }

      if (summary.status === 'needs_account_approval') {
        Alert.alert(
          'Bank accounts found',
          `Found ${summary.pendingAccountApprovalCount} bank account${summary.pendingAccountApprovalCount === 1 ? '' : 's'} that need approval before MoneyKai fetches transactions. Review them in Notifications.`
        );
        return;
      }

      const details = [
        `Scanned ${summary.scannedCount} recent SMS.`,
        summary.approvedAccountCount > 0 ? `${summary.approvedAccountCount} monitored accounts checked.` : undefined,
        summary.accountsSkippedCount > 0 ? `${summary.accountsSkippedCount} unselected or declined accounts skipped.` : undefined,
        summary.draftedCount > 0 ? `Created ${summary.draftedCount} review drafts.` : undefined,
        summary.pendingReviewCount > 0 ? `${summary.pendingReviewCount} waiting for category approval.` : undefined,
        summary.duplicateCount > 0 ? `${summary.duplicateCount} duplicates skipped.` : undefined,
        summary.nativeIgnoredCount + summary.parserIgnoredCount > 0
          ? `${summary.nativeIgnoredCount + summary.parserIgnoredCount} non-transaction messages ignored.`
          : undefined,
      ]
        .filter(Boolean)
        .join('\n');

      Alert.alert(
        summary.draftedCount > 0 ? 'SMS drafts imported' : 'No new drafts',
        details || 'No official bank or payment transaction SMS were found for the selected range.'
      );
    } finally {
      setIsSmsInboxImporting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[]}>
      <View style={{ paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Auto Capture
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
              Review transaction drafts before they affect your budget.
            </Text>
          </View>
          {smsResearchBuildEnabled ? (
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {nativeSmsResearchBuildEnabled ? (
                <TouchableOpacity
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Import recent SMS"
                  activeOpacity={0.78}
                  onPress={handleImportRecentSmsInbox}
                  disabled={isSmsInboxImporting}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: BorderRadius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: canImportSmsInbox ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: canImportSmsInbox ? colors.primary : colors.border,
                    opacity: isSmsInboxImporting ? 0.7 : 1,
                  }}
                >
                  <MaterialCommunityIcons
                    name="message-processing-outline"
                    size={20}
                    color={canImportSmsInbox ? colors.textInverse : colors.textSecondary}
                  />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                accessible
                accessibilityRole="button"
                accessibilityLabel="Paste SMS"
                activeOpacity={0.78}
                onPress={handleOpenSmsImport}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: BorderRadius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: canPasteSms ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: canPasteSms ? colors.primary : colors.border,
                }}
              >
                <MaterialCommunityIcons
                  name="message-text-outline"
                  size={20}
                  color={canPasteSms ? colors.textInverse : colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: Spacing['2xl'] }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
          <Card variant="outlined" borderRadius="md" style={{ flex: 1 }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Pending</Text>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
              {pendingDrafts.length}
            </Text>
          </Card>
          <Card variant="outlined" borderRadius="md" style={{ flex: 1 }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Learned rules</Text>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
              {merchantRules.length}
            </Text>
          </Card>
        </View>

        {nativeSmsResearchBuildEnabled ? (
          <Card variant="outlined" borderRadius="md" padding="md" style={{ marginBottom: Spacing.md, backgroundColor: colors.surface }}>
            <SmsImportRangeSelector
              value={smsImportRangeId}
              onChange={setSmsImportRangeId}
              disabled={isSmsInboxImporting}
            />
          </Card>
        ) : null}

        {hiddenNotificationSignals.length > 0 ? (
          <Card variant="outlined" borderRadius="md" padding="md" style={{ marginBottom: Spacing.md, backgroundColor: colors.surface }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
              <MaterialCommunityIcons name="lock-alert-outline" size={20} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Notification content is hidden
                </Text>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18, marginTop: 3 }}>
                  MoneyKai saw a likely bank or payment notification, but Android did not expose the transaction text. Enable notification previews for that app or paste the SMS here for review.
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        {showCaptureSetup ? (
          <Card variant="outlined" borderRadius="md" padding="md" style={{ marginBottom: Spacing.md, backgroundColor: colors.surface }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1, gap: Spacing.sm }}>
                <View>
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    Set up Transaction Capture
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18, marginTop: 3 }}>
                    Turn it on from Settings, then review drafts here before anything reaches your budget.
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                  <Button
                    title="Capture Settings"
                    icon="cog-outline"
                    size="sm"
                    onPress={() => router.push('/(tabs)/settings' as any)}
                    style={{ flexGrow: 1 }}
                  />
                  <Button
                    title="Privacy Details"
                    icon="shield-lock-outline"
                    size="sm"
                    variant="outline"
                    onPress={() => router.push('/privacy-policy' as any)}
                    style={{ flexGrow: 1 }}
                  />
                </View>
              </View>
            </View>
          </Card>
        ) : null}

        {pendingDrafts.length === 0 ? (
          <EmptyState
            icon="check-circle-outline"
            title="No drafts to review"
            message="Captured transactions will appear here as reviewable drafts."
          />
        ) : (
          <>
            {pendingDrafts.length > MAX_VISIBLE_DRAFT_CARDS ? (
              <Card variant="outlined" borderRadius="md" padding="md" style={{ marginBottom: Spacing.md, backgroundColor: colors.surface }}>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Showing first {MAX_VISIBLE_DRAFT_CARDS} drafts
                </Text>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18, marginTop: 3 }}>
                  Confirm or ignore these to reveal the remaining {pendingDrafts.length - MAX_VISIBLE_DRAFT_CARDS} captured drafts.
                </Text>
              </Card>
            ) : null}
            {visiblePendingDrafts.map((draft) => <DraftCard key={draft.id} draft={draft} onBudgetRequired={showBudgetRequired} />)}
          </>
        )}

        {recentSignals.length > 0 ? (
          <View style={{ marginTop: Spacing.lg }}>
            <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
              Recent Signals
            </Text>
            {recentSignals.map((signal) => (
              <View
                key={signal.id}
                style={{
                  paddingVertical: Spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderLight,
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                  {signal.parsedMerchant ?? signal.sender ?? signal.sourceApp ?? signal.source}
                </Text>
                <View style={{ marginTop: 6 }}>
                  <SourceBadge source={signal.source} sourceApp={signal.sourceApp} />
                </View>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary, marginTop: 2 }}>
                  {signal.processingStatus} | {signal.parseReason ?? signal.ignoreReason ?? signal.receivedAt}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {smsResearchBuildEnabled ? (
        <ModalSheet
          visible={showSmsImport}
          title="Paste SMS"
          subtitle="Play-safe SMS research. MoneyKai creates reviewable drafts from pasted text and stores only sanitized capture fields."
          onClose={() => {
            resetSmsImport();
            setShowSmsImport(false);
          }}
          footer={
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  resetSmsImport();
                  setShowSmsImport(false);
                }}
                style={{ flex: 1 }}
              />
              <Button title="Create Draft" icon="text-box-plus-outline" onPress={handleSubmitSmsImport} style={{ flex: 1 }} />
            </View>
          }
        >
          <View style={{ gap: Spacing.sm }}>
            <Input
              label="Sender"
              placeholder="HDFCBK"
              value={smsSender}
              onChangeText={setSmsSender}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={32}
            />
            <Input
              label="Message"
              placeholder="Paste the transaction SMS"
              value={smsBody}
              onChangeText={(value) => {
                setSmsBody(value);
                if (smsImportError) setSmsImportError(undefined);
              }}
              multiline
              numberOfLines={5}
              autoCapitalize="sentences"
              autoCorrect={false}
              maxLength={500}
              error={smsImportError}
              inputStyle={{ minHeight: 120 }}
            />
            <Card variant="outlined" borderRadius="md" padding="md" style={{ backgroundColor: colors.surface }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.textSecondary} />
                <Text style={{ flex: 1, fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
                  Raw pasted text is discarded after parsing. Confirmed transactions are added only after review.
                </Text>
              </View>
            </Card>
          </View>
        </ModalSheet>
      ) : null}
      <BudgetRequiredDialog
        visible={showBudgetDialog}
        message="Set a monthly budget before confirming captured transactions or importing SMS drafts."
        onCancel={() => setShowBudgetDialog(false)}
        onSetBudget={handleSetBudget}
      />
      <SmsImportProgressSheet
        visible={showSmsImportProgress}
        progress={smsImportProgress}
        onClose={() => setShowSmsImportProgress(false)}
      />
    </SafeAreaView>
  );
}
