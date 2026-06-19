import React from 'react';
import { Alert, Linking, Platform, Switch, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { FINANCIAL_EMAIL_CATEGORIES, GMAIL_RESTRICTED_SCOPE_NOTICE } from '@/constants/financialEmailRules';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { isGmailSyncEnabled } from '@/config/environment';
import { useTheme } from '@/hooks/useTheme';
import { gmailSyncApi } from '@/services/gmailSyncApi';
import { financialDocumentApi } from '@/services/financialDocumentApi';
import { useFinancialDocumentStore } from '@/stores/useFinancialDocumentStore';
import { useGmailSyncStore } from '@/stores/useGmailSyncStore';
import type { FinancialEmailCategory, FinancialEmailRecord, GmailSyncConsent } from '@/types/gmail';

const CATEGORY_LABELS = Object.fromEntries(FINANCIAL_EMAIL_CATEGORIES.map((category) => [category.key, category.label]));

const GMAIL_SYNC_WINDOW_OPTIONS: Array<{
  value: GmailSyncConsent['syncWindow'];
  label: string;
  detail: string;
  maxResults: number;
}> = [
  { value: '15d', label: '15 days', detail: 'Fast check for recent statements and receipts.', maxResults: 50 },
  { value: '30d', label: '1 month', detail: 'Balanced monthly inbox review.', maxResults: 75 },
  { value: '90d', label: '3 months', detail: 'Quarterly financial email scan.', maxResults: 150 },
  { value: '180d', label: '6 months', detail: 'Wider review for older statements.', maxResults: 250 },
  { value: 'all', label: 'All time', detail: 'Scans matching financial emails across Gmail, capped at 500 messages per run.', maxResults: 500 },
];

const isGoogleAuthorizationUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'accounts.google.com';
  } catch {
    return false;
  }
};

const getWebLocation = () =>
  globalThis as typeof globalThis & {
    location?: { href?: string; origin?: string; pathname?: string };
    history?: { replaceState?: (data: unknown, unused: string, url?: string | URL | null) => void };
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
  };

const getGmailOAuthReturnTo = (): string | undefined => {
  if (Platform.OS === 'web') {
    const origin = getWebLocation().location?.origin;
    return origin ? `${origin}/settings` : undefined;
  }

  return 'moneykai-mobile://more';
};

export const GmailConnectionCard: React.FC = () => {
  const { colors } = useTheme();
  const featureEnabled = isGmailSyncEnabled();
  const [showConsent, setShowConsent] = React.useState(false);
  const [showEmails, setShowEmails] = React.useState(false);
  const [showSyncWindow, setShowSyncWindow] = React.useState(false);
  const [busy, setBusy] = React.useState<'connect' | 'refresh' | 'sync' | 'disconnect' | null>(null);
  const consent = useGmailSyncStore((state) => state.consent);
  const connection = useGmailSyncStore((state) => state.connection);
  const status = useGmailSyncStore((state) => state.status);
  const emails = useGmailSyncStore((state) => state.emails);
  const lastSyncSummary = useGmailSyncStore((state) => state.lastSyncSummary);
  const setAllowedCategories = useGmailSyncStore((state) => state.setAllowedCategories);
  const setSyncWindow = useGmailSyncStore((state) => state.setSyncWindow);
  const acceptMetadataScan = useGmailSyncStore((state) => state.acceptMetadataScan);
  const acceptAttachmentDownloads = useGmailSyncStore((state) => state.acceptAttachmentDownloads);
  const setStatus = useGmailSyncStore((state) => state.setStatus);
  const setEmails = useGmailSyncStore((state) => state.setEmails);
  const setLastSyncSummary = useGmailSyncStore((state) => state.setLastSyncSummary);
  const resetGmailSync = useGmailSyncStore((state) => state.resetGmailSync);
  const addOrUpdateDocument = useFinancialDocumentStore((state) => state.addOrUpdateDocument);
  const providerReady = featureEnabled && status.enabled;
  const metadataAccepted = Boolean(consent.metadataScanAcceptedAt);
  const attachmentDownloadsAccepted = Boolean(consent.attachmentDownloadAcceptedAt);
  const isConnected = connection?.status === 'connected';
  const setupItems = status.manualSetupRequired ?? status.checklist ?? [];
  const restrictedScopes = status.restrictedScopes ?? ['https://www.googleapis.com/auth/gmail.metadata'];

  const hydrateStatus = React.useCallback(async () => {
    if (!featureEnabled) {
      return;
    }
    try {
      const nextStatus = await gmailSyncApi.getStatus();
      setStatus(nextStatus);
      if (nextStatus.enabled && metadataAccepted) {
        const nextEmails = await gmailSyncApi.listEmails();
        setEmails(nextEmails);
      }
    } catch (error) {
      Alert.alert('Gmail status failed', error instanceof Error ? error.message : 'Could not refresh Gmail status.');
    }
  }, [featureEnabled, metadataAccepted, setEmails, setStatus]);

  const consumeOAuthReturn = React.useCallback((url?: string | null) => {
    if (!url || !providerReady) {
      return;
    }

    try {
      const parsed = new URL(url);
      if (parsed.searchParams.get('gmail') !== 'connected') {
        return;
      }

      void hydrateStatus();
      if (Platform.OS === 'web') {
        parsed.searchParams.delete('gmail');
        getWebLocation().history?.replaceState?.({}, '', `${parsed.pathname}${parsed.search}${parsed.hash}`);
      }
    } catch {
      // Deep-link parsing is best effort; the manual Refresh button still works.
    }
  }, [providerReady, hydrateStatus]);

  const refreshStatus = React.useCallback(async () => {
    setBusy('refresh');
    try {
      await hydrateStatus();
    } finally {
      setBusy(null);
    }
  }, [hydrateStatus]);

  React.useEffect(() => {
    if (featureEnabled) {
      void hydrateStatus();
    }
  }, [featureEnabled, hydrateStatus]);

  React.useEffect(() => {
    if (!providerReady || !metadataAccepted) {
      return undefined;
    }

    if (Platform.OS === 'web') {
      consumeOAuthReturn(getWebLocation().location?.href);
    }

    void Linking.getInitialURL().then(consumeOAuthReturn).catch(() => undefined);
    const subscription = Linking.addEventListener('url', (event) => consumeOAuthReturn(event.url));
    return () => subscription.remove();
  }, [consumeOAuthReturn, providerReady, metadataAccepted]);

  React.useEffect(() => {
    if (!providerReady || !metadataAccepted || Platform.OS !== 'web') {
      return undefined;
    }

    const refreshAfterOAuth = () => {
      void hydrateStatus();
    };
    const web = getWebLocation();
    web.addEventListener?.('focus', refreshAfterOAuth);
    web.addEventListener?.('visibilitychange', refreshAfterOAuth);

    return () => {
      web.removeEventListener?.('focus', refreshAfterOAuth);
      web.removeEventListener?.('visibilitychange', refreshAfterOAuth);
    };
  }, [hydrateStatus, metadataAccepted, providerReady]);

  const refreshAfterConnectAttempt = React.useCallback(() => {
    globalThis.setTimeout(() => {
      void hydrateStatus();
    }, 2500);
  }, [hydrateStatus]);

  const toggleCategory = (category: FinancialEmailCategory, selected: boolean) => {
    const next = selected
      ? [...consent.allowedCategories, category]
      : consent.allowedCategories.filter((item) => item !== category);
    setAllowedCategories(next);
  };

  const handleAccept = () => {
    acceptMetadataScan();
    setShowConsent(false);
  };

  const handleAcceptAttachments = () => {
    acceptAttachmentDownloads();
    setShowConsent(false);
  };

  const handleConnect = async () => {
    if (!metadataAccepted || !consent.metadataScanAcceptedAt) {
      setShowConsent(true);
      return;
    }

    setBusy('connect');
    try {
      const response = await gmailSyncApi.startConnect(consent.metadataScanAcceptedAt, getGmailOAuthReturnTo());
      if (response.enabled === false || !response.authorizationUrl) {
        Alert.alert('Gmail setup required', response.message ?? 'Configure Gmail OAuth before connecting.');
        setStatus({
          ...status,
          enabled: false,
          message: response.message ?? status.message,
          checklist: response.checklist ?? status.checklist,
          manualSetupRequired: response.manualSetupRequired ?? status.manualSetupRequired,
        });
        setShowConsent(true);
        return;
      }
      if (!isGoogleAuthorizationUrl(response.authorizationUrl)) {
        Alert.alert('Gmail connect failed', 'MoneyKai received an unexpected Google authorization URL.');
        return;
      }
      const opened = await Linking.openURL(response.authorizationUrl).then(() => true).catch(() => false);
      if (!opened) {
        Alert.alert('Open Gmail consent', response.authorizationUrl);
      }
      refreshAfterConnectAttempt();
    } catch (error) {
      Alert.alert('Gmail connect failed', error instanceof Error ? error.message : 'Could not start Gmail connection.');
    } finally {
      setBusy(null);
    }
  };

  const handleSync = async (option: (typeof GMAIL_SYNC_WINDOW_OPTIONS)[number]) => {
    if (!consent.metadataScanAcceptedAt) {
      setShowConsent(true);
      return;
    }
    if (!isConnected) {
      Alert.alert('Connect Gmail first', 'Finish Google consent and refresh status before syncing metadata.');
      return;
    }

    setBusy('sync');
    setShowSyncWindow(false);
    try {
      setSyncWindow(option.value);
      const summary = await gmailSyncApi.syncMetadata({
        metadataScanAcceptedAt: consent.metadataScanAcceptedAt,
        allowedCategories: consent.allowedCategories,
        syncWindow: option.value,
        maxResults: option.maxResults,
      });
      setLastSyncSummary(summary);
      setEmails(summary.items);
      await hydrateStatus();
      Alert.alert('Gmail sync complete', `${summary.financialEmailCount} financial emails need review from ${option.label.toLowerCase()}.`);
    } catch (error) {
      Alert.alert('Gmail sync failed', error instanceof Error ? error.message : 'Could not sync Gmail metadata.');
    } finally {
      setBusy(null);
    }
  };

  const handleDisconnect = async () => {
    setBusy('disconnect');
    try {
      await gmailSyncApi.disconnect();
      resetGmailSync();
    } catch (error) {
      Alert.alert('Disconnect failed', error instanceof Error ? error.message : 'Could not disconnect Gmail.');
    } finally {
      setBusy(null);
    }
  };

  const handleQueueAttachments = async (item: FinancialEmailRecord) => {
    if (!consent.attachmentDownloadAcceptedAt) {
      Alert.alert('Attachment consent required', 'Review Gmail consent and enable attachment downloads before queueing PDFs.');
      setShowConsent(true);
      return;
    }

    setBusy('sync');
    try {
      const response = await financialDocumentApi.queueGmailAttachments({
        gmailMessageId: item.gmailMessageId,
        attachmentDownloadAcceptedAt: consent.attachmentDownloadAcceptedAt,
        allowedCategories: consent.allowedCategories,
      });
      response.items.forEach(addOrUpdateDocument);
      Alert.alert('Documents queued', `${response.queuedCount} PDF attachments were queued for review.`);
    } catch (error) {
      Alert.alert('Queue failed', error instanceof Error ? error.message : 'Could not queue Gmail attachments.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Card style={{ marginBottom: Spacing.md }} variant="outlined">
        <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: BorderRadius.sm,
              backgroundColor: providerReady ? colors.primaryBg : `${colors.warning}18`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="gmail" size={22} color={providerReady ? colors.primary : colors.warning} />
          </View>
          <View style={{ flex: 1, gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Gmail financial inbox
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
              {providerReady
                ? connection?.email ?? (metadataAccepted ? 'Consent ready. OAuth connection is pending.' : 'Consent required before any Gmail scan.')
                : status.message ?? GMAIL_RESTRICTED_SCOPE_NOTICE}
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', paddingTop: Spacing.xs }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
                {consent.allowedCategories.length} categories
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
                {metadataAccepted ? 'Consent accepted' : 'Consent pending'}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
                {attachmentDownloadsAccepted ? 'Attachments allowed' : 'Attachments off'}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
                {isConnected ? 'Connected' : connection?.status ?? 'Not connected'}
              </Text>
              {!providerReady ? (
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.warning }}>
                  Setup required
                </Text>
              ) : null}
            </View>
          </View>
        </View>
        {!providerReady ? (
          <View
            style={{
              marginTop: Spacing.md,
              padding: Spacing.md,
              borderRadius: BorderRadius.md,
              borderWidth: 1,
              borderColor: `${colors.warning}44`,
              backgroundColor: `${colors.warning}12`,
              gap: Spacing.xs,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Gmail sync is not live yet
            </Text>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
              The app can show consent copy now, but Google OAuth credentials, backend token storage, and restricted-scope verification must be completed before connecting accounts.
            </Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginTop: Spacing.md }}>
          <Button
            title={providerReady ? 'Consent' : 'Setup'}
            icon="shield-check-outline"
            onPress={() => setShowConsent(true)}
            variant={providerReady ? 'outline' : 'outline'}
            style={{ flexGrow: 1 }}
          />
          <Button
            title={isConnected ? 'Refresh' : 'Connect'}
            icon={isConnected ? 'refresh' : 'link-variant'}
            onPress={isConnected ? refreshStatus : handleConnect}
            loading={busy === 'connect' || busy === 'refresh'}
            disabled={!providerReady || !metadataAccepted}
            style={{ flexGrow: 1 }}
          />
          {!isConnected ? (
            <Button
              title="Refresh"
              icon="refresh"
              onPress={refreshStatus}
              loading={busy === 'refresh'}
              disabled={!providerReady}
              variant="outline"
              style={{ flexGrow: 1 }}
            />
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginTop: Spacing.sm }}>
          <Button
            title="Sync"
            icon="sync"
            onPress={() => setShowSyncWindow(true)}
            loading={busy === 'sync'}
            disabled={!providerReady || !isConnected || !metadataAccepted}
            style={{ flexGrow: 1 }}
          />
          <Button
            title="Review"
            icon="email-search-outline"
            onPress={() => setShowEmails(true)}
            variant="outline"
            disabled={emails.length === 0}
            style={{ flexGrow: 1 }}
          />
          {connection ? (
            <Button
              title="Disconnect"
              icon="link-variant-off"
              onPress={handleDisconnect}
              loading={busy === 'disconnect'}
              variant="ghost"
              disabled={!providerReady}
              style={{ flexGrow: 1 }}
            />
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginTop: Spacing.md }}>
          <Stat label="Found" value={status.financialEmailCount} />
          <Stat label="Needs password" value={status.needsPasswordCount} />
          <Stat label="Ignored" value={emails.filter((item) => item.parseStatus === 'ignored').length} />
        </View>
        {lastSyncSummary ? (
          <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
            Last sync scanned {lastSyncSummary.scannedMessageCount} messages with a filtered Gmail query.
          </Text>
        ) : null}
      </Card>

      <ModalSheet
        visible={showConsent}
        title={providerReady ? 'Gmail consent' : 'Gmail setup required'}
        subtitle={
          providerReady
            ? 'MoneyKai only scans selected financial categories and stores metadata needed for review.'
            : 'Gmail restricted-scope sync needs Google Cloud OAuth setup, verification, and backend routes before it can connect users.'
        }
        onClose={() => setShowConsent(false)}
        footer={
          <View style={{ gap: Spacing.sm }}>
            {providerReady ? (
              <>
                <Button title="Accept Metadata Scan" icon="shield-check-outline" onPress={handleAccept} />
                <Button
                  title="Allow Attachment Queue"
                  icon="paperclip"
                  onPress={handleAcceptAttachments}
                  variant={metadataAccepted ? 'outline' : 'ghost'}
                  disabled={!metadataAccepted}
                />
              </>
            ) : null}
            <Button title="Not Now" onPress={() => setShowConsent(false)} variant="outline" />
          </View>
        }
      >
        <View style={{ gap: Spacing.md }}>
          {!providerReady ? (
            <View style={{ gap: Spacing.sm }}>
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Manual setup left
              </Text>
              {setupItems.map((item) => (
                <View key={item} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                  <MaterialCommunityIcons name="progress-alert" size={18} color={colors.warning} />
                  <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
                    {item}
                  </Text>
                </View>
              ))}
              <Text style={{ marginTop: Spacing.xs, fontSize: Typography.fontSize.xs, color: colors.textTertiary, lineHeight: 18 }}>
                Restricted scopes: {restrictedScopes.join(', ')}
              </Text>
            </View>
          ) : null}
          {[
            'No Gmail sync runs until this consent and OAuth connection are both complete.',
            'Attachments download only after you allow attachment queueing for selected financial emails.',
            'Salary slips stay off unless explicitly selected.',
            'Unrelated email bodies are not persisted.',
          ].map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
                {item}
              </Text>
            </View>
          ))}
          <View style={{ gap: Spacing.sm }}>
            {FINANCIAL_EMAIL_CATEGORIES.map((category) => (
              <View key={category.key} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: colors.textPrimary }}>
                  {category.label}{category.sensitive ? ' (sensitive)' : ''}
                </Text>
                <Switch
                  value={consent.allowedCategories.includes(category.key)}
                  onValueChange={(value) => toggleCategory(category.key, value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.textInverse}
                />
              </View>
            ))}
          </View>
        </View>
      </ModalSheet>

      <ModalSheet
        visible={showEmails}
        title="Financial emails"
        subtitle="Metadata only. Attachments and raw email bodies are not downloaded in this phase."
        onClose={() => setShowEmails(false)}
        footer={<Button title="Close" onPress={() => setShowEmails(false)} variant="outline" />}
      >
        <View style={{ gap: Spacing.sm }}>
          {emails.length === 0 ? (
            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
              No classified Gmail metadata yet.
            </Text>
          ) : (
            emails.map((item) => <EmailRow key={item.id} item={item} onQueue={handleQueueAttachments} />)
          )}
        </View>
      </ModalSheet>

      <ModalSheet
        visible={showSyncWindow}
        title="Choose sync range"
        subtitle="MoneyKai scans matching financial email metadata only. Larger ranges can take longer."
        onClose={() => setShowSyncWindow(false)}
        footer={<Button title="Cancel" onPress={() => setShowSyncWindow(false)} variant="outline" />}
      >
        <View style={{ gap: Spacing.sm }}>
          {GMAIL_SYNC_WINDOW_OPTIONS.map((option) => {
            const selected = consent.syncWindow === option.value;
            return (
              <Button
                key={option.value}
                title={`${option.label} (${option.maxResults} max)`}
                icon={selected ? 'check-circle' : 'clock-outline'}
                onPress={() => handleSync(option)}
                loading={busy === 'sync' && selected}
                disabled={busy === 'sync'}
                variant={selected ? 'primary' : 'outline'}
                fullWidth
              />
            );
          })}
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary, lineHeight: 18 }}>
            All time uses Gmail's full matching history but still limits each run to 500 messages so the sync stays responsive.
          </Text>
        </View>
      </ModalSheet>
    </>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, minWidth: 92, padding: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: colors.surface }}>
      <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>{label}</Text>
      <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
        {value}
      </Text>
    </View>
  );
};

const EmailRow = ({ item, onQueue }: { item: FinancialEmailRecord; onQueue: (item: FinancialEmailRecord) => void }) => {
  const { colors } = useTheme();
  const isIgnored = item.parseStatus === 'ignored';
  return (
    <View
      style={{
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        gap: Spacing.xs,
      }}
    >
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            {item.subject || 'No subject'}
          </Text>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
            {item.sender}
          </Text>
        </View>
        <Text style={{ fontSize: Typography.fontSize.xs, color: isIgnored ? colors.textTertiary : colors.primary }}>
          {isIgnored ? 'Ignored' : 'Review'}
        </Text>
      </View>
      <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
        {CATEGORY_LABELS[item.category] ?? item.category} | {item.attachmentCount} attachments
      </Text>
      {item.classificationReason ? (
        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary, lineHeight: 18 }}>
          {item.classificationReason}
        </Text>
      ) : null}
      {!isIgnored && item.hasAttachments ? (
        <Button
          title="Queue PDFs"
          icon="paperclip"
          onPress={() => onQueue(item)}
          size="sm"
          variant="outline"
          style={{ alignSelf: 'flex-start', marginTop: Spacing.xs }}
        />
      ) : null}
    </View>
  );
};
