import React from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AssetAllocationChart } from '@/components/portfolio/AssetAllocationChart';
import { HoldingsList } from '@/components/portfolio/HoldingsList';
import { ManualHoldingSheet } from '@/components/portfolio/ManualHoldingSheet';
import { PortfolioInsightCard } from '@/components/portfolio/PortfolioInsightCard';
import { PortfolioSummaryCard } from '@/components/portfolio/PortfolioSummaryCard';
import { ProviderConnectionCard } from '@/components/portfolio/ProviderConnectionCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { isWealthTabEnabled } from '@/config/environment';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { financialAiApi } from '@/services/financialAiApi';
import { portfolioApi } from '@/services/portfolioApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { AccountAggregatorExplorationStatus, PortfolioAccount, PortfolioHolding, PortfolioHoldingDraft } from '@/types/portfolio';
import type { WealthInsight } from '@/types/wealth';
import { buildWealthOverview } from '@/utils/wealthAnalytics';

export default function WealthScreen() {
  const { colors } = useTheme();
  const enabled = isWealthTabEnabled();
  const [showManualEntry, setShowManualEntry] = React.useState(false);
  const [aaStatus, setAaStatus] = React.useState<AccountAggregatorExplorationStatus | null>(null);
  const [busy, setBusy] = React.useState<'refresh' | 'manual' | 'snapshot' | 'ai' | null>(null);
  const [aiInsights, setAiInsights] = React.useState<WealthInsight[]>([]);
  const [busyAccountId, setBusyAccountId] = React.useState<string | undefined>();
  const [busyHoldingId, setBusyHoldingId] = React.useState<string | undefined>();
  const user = useAuthStore((state) => state.user);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const accounts = usePortfolioStore((state) => state.accounts);
  const holdings = usePortfolioStore((state) => state.holdings);
  const lastUpdatedAt = usePortfolioStore((state) => state.lastUpdatedAt);
  const setPortfolioState = usePortfolioStore((state) => state.setPortfolioState);
  const upsertAccount = usePortfolioStore((state) => state.upsertAccount);
  const upsertHolding = usePortfolioStore((state) => state.upsertHolding);
  const removeHolding = usePortfolioStore((state) => state.removeHolding);
  const setSnapshot = usePortfolioStore((state) => state.setSnapshot);
  const overview = React.useMemo(
    () => buildWealthOverview(user?.id ?? 'local', accounts, holdings),
    [accounts, holdings, user?.id]
  );

  const refreshPortfolio = React.useCallback(async () => {
    if (!enabled) {
      return;
    }
    setBusy('refresh');
    try {
      setPortfolioState(await portfolioApi.getState());
    } catch (error) {
      Alert.alert('Portfolio refresh failed', error instanceof Error ? error.message : 'Could not refresh wealth data.');
    } finally {
      setBusy(null);
    }
  }, [enabled, setPortfolioState]);

  React.useEffect(() => {
    void refreshPortfolio();
  }, [refreshPortfolio]);

  const handleManualSubmit = async (payload: PortfolioHoldingDraft) => {
    setBusy('manual');
    try {
      upsertHolding(await portfolioApi.createHolding(payload));
      setPortfolioState(await portfolioApi.getState());
      setShowManualEntry(false);
    } catch (error) {
      Alert.alert('Manual entry failed', error instanceof Error ? error.message : 'Could not add this holding.');
    } finally {
      setBusy(null);
    }
  };

  const handleCreateManualAccount = async () => {
    setBusy('manual');
    try {
      const account = await portfolioApi.createConnectionMetadata({
        provider: 'manual',
        accountType: 'manual',
        displayName: 'Manual wealth',
      });
      upsertAccount(account);
    } catch (error) {
      Alert.alert('Manual account failed', error instanceof Error ? error.message : 'Could not create manual account.');
    } finally {
      setBusy(null);
    }
  };

  const handleSyncAccount = async (account: PortfolioAccount) => {
    setBusyAccountId(account.id);
    try {
      const response = await portfolioApi.syncConnection(account.id);
      upsertAccount(response.account);
      response.holdings.forEach(upsertHolding);
      setSnapshot(response.snapshot);
      Alert.alert('Sync complete', response.message);
    } catch (error) {
      Alert.alert('Sync failed', error instanceof Error ? error.message : 'Could not sync this provider.');
    } finally {
      setBusyAccountId(undefined);
    }
  };

  const handlePauseAccount = async (account: PortfolioAccount) => {
    setBusyAccountId(account.id);
    try {
      upsertAccount(await portfolioApi.pauseConnection(account.id));
    } catch (error) {
      Alert.alert('Pause failed', error instanceof Error ? error.message : 'Could not pause this provider.');
    } finally {
      setBusyAccountId(undefined);
    }
  };

  const handleDisconnectAccount = async (account: PortfolioAccount) => {
    setBusyAccountId(account.id);
    try {
      upsertAccount(await portfolioApi.disconnectConnection(account.id));
    } catch (error) {
      Alert.alert('Disconnect failed', error instanceof Error ? error.message : 'Could not disconnect this provider.');
    } finally {
      setBusyAccountId(undefined);
    }
  };

  const handleDeleteHolding = async (holding: PortfolioHolding) => {
    setBusyHoldingId(holding.id);
    try {
      await portfolioApi.deleteHolding(holding.id);
      removeHolding(holding.id);
      setPortfolioState(await portfolioApi.getState());
    } catch (error) {
      Alert.alert('Remove failed', error instanceof Error ? error.message : 'Could not remove this holding.');
    } finally {
      setBusyHoldingId(undefined);
    }
  };

  const handleSnapshot = async () => {
    setBusy('snapshot');
    try {
      setSnapshot(await portfolioApi.createSnapshot());
    } catch (error) {
      Alert.alert('Snapshot failed', error instanceof Error ? error.message : 'Could not refresh the wealth snapshot.');
    } finally {
      setBusy(null);
    }
  };

  const handleGenerateAiInsights = async () => {
    setBusy('ai');
    try {
      const response = await financialAiApi.generateWealthInsights({
        snapshot: overview.snapshot,
        holdings: holdings.slice(0, 25),
      });
      setAiInsights(response.insights);
      if (!response.enabled) {
        Alert.alert('AI insights', 'Financial AI is disabled on the backend, so MoneyKai returned deterministic review-required insights.');
      }
    } catch (error) {
      Alert.alert('AI insights failed', error instanceof Error ? error.message : 'Could not generate wealth insights.');
    } finally {
      setBusy(null);
    }
  };

  const handleStartZerodha = async () => {
    try {
      const response = await portfolioApi.startZerodhaConnect();
      if (response.enabled && response.authorizationUrl) {
        const opened = await Linking.openURL(response.authorizationUrl).then(() => true).catch(() => false);
        if (!opened) {
          Alert.alert('Open Zerodha', response.authorizationUrl);
        }
        return;
      }
      Alert.alert('Zerodha setup', response.message);
    } catch (error) {
      Alert.alert('Zerodha unavailable', error instanceof Error ? error.message : 'Could not start Zerodha connection.');
    }
  };

  const handleExploreAa = async () => {
    try {
      setAaStatus(await portfolioApi.getAccountAggregatorExploration());
    } catch (error) {
      Alert.alert('Account Aggregator unavailable', error instanceof Error ? error.message : 'Could not load AA status.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: Spacing['2xl'], gap: Spacing.base }}
      >
        <View style={{ gap: Spacing.xs }}>
          <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
            Wealth
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
            {lastUpdatedAt ? `Last updated ${new Date(lastUpdatedAt).toLocaleString()}` : 'No wealth data synced yet'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingTop: Spacing.sm }}>
            <Button title="Refresh" icon="refresh" onPress={refreshPortfolio} loading={busy === 'refresh'} disabled={!enabled} size="sm" />
            <Button title="Add" icon="plus" onPress={() => setShowManualEntry(true)} disabled={!enabled} size="sm" variant="outline" />
            <Button title="Snapshot" icon="camera-outline" onPress={handleSnapshot} loading={busy === 'snapshot'} disabled={!enabled} size="sm" variant="outline" />
          </View>
        </View>

        {!enabled ? (
          <Card variant="outlined" style={{ gap: Spacing.md }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: BorderRadius.sm,
                backgroundColor: colors.primaryBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.primary} />
            </View>
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Wealth monitoring is gated
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
              Enable the build flag only after provider consent, privacy copy, and backend metadata storage are ready.
            </Text>
          </Card>
        ) : null}

        <PortfolioSummaryCard snapshot={overview.snapshot} currencySymbol={currencySymbol} />
        <AssetAllocationChart allocation={overview.allocation} currencySymbol={currencySymbol} />
        <HoldingsList
          holdings={overview.topHoldings}
          currencySymbol={currencySymbol}
          busyHoldingId={busyHoldingId}
          onDelete={enabled ? handleDeleteHolding : undefined}
        />
        <ProviderConnectionCard
          accounts={accounts}
          enabled={enabled}
          busyAccountId={busyAccountId}
          onAddManual={() => setShowManualEntry(true)}
          onCreateManualAccount={handleCreateManualAccount}
          onStartZerodha={handleStartZerodha}
          onExploreAccountAggregator={handleExploreAa}
          onSync={handleSyncAccount}
          onPause={handlePauseAccount}
          onDisconnect={handleDisconnectAccount}
        />
        <PortfolioInsightCard
          insights={overview.insights}
          aiInsights={aiInsights}
          loadingAiInsights={busy === 'ai'}
          onGenerateAiInsights={enabled ? handleGenerateAiInsights : undefined}
        />
      </ScrollView>
      <ManualHoldingSheet
        visible={showManualEntry}
        currencySymbol={currencySymbol}
        loading={busy === 'manual'}
        onClose={() => setShowManualEntry(false)}
        onSubmit={handleManualSubmit}
      />
      <ModalSheet
        visible={Boolean(aaStatus)}
        title="Account Aggregator"
        subtitle="Exploratory provider status for consented financial data sharing."
        onClose={() => setAaStatus(null)}
        footer={<Button title="Close" onPress={() => setAaStatus(null)} variant="outline" />}
      >
        <View style={{ gap: Spacing.md }}>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
            {aaStatus?.productionReady
              ? 'A production Account Aggregator path is configured.'
              : 'Production AA connectivity requires an FIU/TSP partner and consent-flow onboarding.'}
          </Text>
          {aaStatus?.checklist.map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
              <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={18} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}
