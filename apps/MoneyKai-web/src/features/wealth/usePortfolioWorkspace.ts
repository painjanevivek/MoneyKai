import React from 'react';
import { Alert, Linking } from 'react-native';
import { isWealthTabEnabled } from '@/config/environment';
import { financialAiApi } from '@/services/financialAiApi';
import { portfolioApi } from '@/services/portfolioApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type {
  AccountAggregatorExplorationStatus,
  PortfolioAccount,
  PortfolioHolding,
  PortfolioHoldingDraft,
} from '@/types/portfolio';
import type { WealthInsight } from '@/types/wealth';
import { buildWealthOverview } from '@/utils/wealthAnalytics';

type WorkspaceBusyState = 'refresh' | 'manual' | 'snapshot' | 'ai' | 'zerodha' | 'aa' | null;

const isZerodhaAuthorizationUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ['kite.zerodha.com', 'zerodha.com', 'www.zerodha.com'].includes(parsed.hostname);
  } catch {
    return false;
  }
};

export interface PortfolioWorkspaceController {
  enabled: boolean;
  currencySymbol: string;
  accounts: PortfolioAccount[];
  holdings: PortfolioHolding[];
  lastUpdatedAt?: string;
  overview: ReturnType<typeof buildWealthOverview>;
  aiInsights: WealthInsight[];
  busy: WorkspaceBusyState;
  busyAccountId?: string;
  busyHoldingId?: string;
  showManualEntry: boolean;
  showZerodhaSheet: boolean;
  aaStatus: AccountAggregatorExplorationStatus | null;
  zerodhaRequestToken: string;
  zerodhaState: string | null;
  zerodhaExpiresAt: string | null;
  zerodhaConnectMessage: string;
  zerodhaSetupItems: string[];
  zerodhaSetupOnly: boolean;
  setShowManualEntry: React.Dispatch<React.SetStateAction<boolean>>;
  setShowZerodhaSheet: React.Dispatch<React.SetStateAction<boolean>>;
  setAaStatus: React.Dispatch<React.SetStateAction<AccountAggregatorExplorationStatus | null>>;
  setZerodhaRequestToken: React.Dispatch<React.SetStateAction<string>>;
  refreshPortfolio: () => Promise<void>;
  handleManualSubmit: (payload: PortfolioHoldingDraft) => Promise<void>;
  handleCreateManualAccount: () => Promise<void>;
  handleSyncAccount: (account: PortfolioAccount) => Promise<void>;
  handlePauseAccount: (account: PortfolioAccount) => Promise<void>;
  handleDisconnectAccount: (account: PortfolioAccount) => Promise<void>;
  handleDeleteHolding: (holding: PortfolioHolding) => Promise<void>;
  handleSnapshot: () => Promise<void>;
  handleGenerateAiInsights: () => Promise<void>;
  handleStartZerodha: () => Promise<void>;
  handleCompleteZerodha: () => Promise<void>;
  handleExploreAa: () => Promise<void>;
}

export function usePortfolioWorkspace(): PortfolioWorkspaceController {
  const enabled = isWealthTabEnabled();
  const [showManualEntry, setShowManualEntry] = React.useState(false);
  const [showZerodhaSheet, setShowZerodhaSheet] = React.useState(false);
  const [aaStatus, setAaStatus] = React.useState<AccountAggregatorExplorationStatus | null>(null);
  const [busy, setBusy] = React.useState<WorkspaceBusyState>(null);
  const [aiInsights, setAiInsights] = React.useState<WealthInsight[]>([]);
  const [zerodhaRequestToken, setZerodhaRequestToken] = React.useState('');
  const [zerodhaState, setZerodhaState] = React.useState<string | null>(null);
  const [zerodhaExpiresAt, setZerodhaExpiresAt] = React.useState<string | null>(null);
  const [zerodhaConnectMessage, setZerodhaConnectMessage] = React.useState('');
  const [zerodhaSetupItems, setZerodhaSetupItems] = React.useState<string[]>([]);
  const [zerodhaSetupOnly, setZerodhaSetupOnly] = React.useState(false);
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

  const hydratePortfolio = React.useCallback(async () => {
    if (!enabled) {
      return;
    }
    try {
      setPortfolioState(await portfolioApi.getState());
    } catch (error) {
      Alert.alert('Portfolio refresh failed', error instanceof Error ? error.message : 'Could not refresh wealth data.');
    }
  }, [enabled, setPortfolioState]);

  const refreshPortfolio = React.useCallback(async () => {
    setBusy('refresh');
    try {
      await hydratePortfolio();
    } finally {
      setBusy(null);
    }
  }, [hydratePortfolio]);

  React.useEffect(() => {
    void hydratePortfolio();
  }, [hydratePortfolio]);

  const handleManualSubmit = async (payload: PortfolioHoldingDraft) => {
    setBusy('manual');
    try {
      upsertHolding(await portfolioApi.createHolding(payload));
      await hydratePortfolio();
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
        displayName: 'Manual portfolio',
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
      await hydratePortfolio();
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
    setBusy('zerodha');
    try {
      const response = await portfolioApi.startZerodhaConnect();
      setZerodhaConnectMessage(response.message);
      setZerodhaSetupItems(response.manualSetupRequired ?? []);
      setZerodhaExpiresAt(response.expiresAt ?? null);

      if (!response.enabled || !response.authorizationUrl || !response.state) {
        setZerodhaState(null);
        setZerodhaRequestToken('');
        setZerodhaSetupOnly(true);
        setShowZerodhaSheet(true);
        return;
      }

      if (!isZerodhaAuthorizationUrl(response.authorizationUrl)) {
        Alert.alert('Zerodha unavailable', 'MoneyKai received an unexpected Zerodha authorization URL.');
        return;
      }

      setZerodhaState(response.state);
      setZerodhaRequestToken('');
      setZerodhaSetupOnly(false);
      setShowZerodhaSheet(true);
      const opened = await Linking.openURL(response.authorizationUrl).then(() => true).catch(() => false);
      if (!opened) {
        Alert.alert('Open Zerodha', response.authorizationUrl);
      }
    } catch (error) {
      Alert.alert('Zerodha unavailable', error instanceof Error ? error.message : 'Could not start Zerodha connection.');
    } finally {
      setBusy(null);
    }
  };

  const handleCompleteZerodha = async () => {
    const requestToken = zerodhaRequestToken.trim();
    if (zerodhaSetupOnly || !zerodhaState) {
      Alert.alert('Zerodha setup required', 'Configure live broker credentials on the backend before completing a Zerodha connection.');
      return;
    }
    if (requestToken.length === 0) {
      Alert.alert('Request token required', 'Paste the Zerodha request token to complete the connection.');
      return;
    }
    setBusy('zerodha');
    try {
      const response = await portfolioApi.completeZerodhaConnect({
        requestToken,
        state: zerodhaState,
      });
      if (!response.enabled) {
        Alert.alert('Zerodha setup required', response.message);
        return;
      }
      if (response.account) {
        upsertAccount(response.account);
      }
      setShowZerodhaSheet(false);
      setZerodhaRequestToken('');
      setZerodhaState(null);
      setZerodhaExpiresAt(null);
      setZerodhaConnectMessage('');
      setZerodhaSetupItems([]);
      setZerodhaSetupOnly(false);
      await hydratePortfolio();
      Alert.alert('Zerodha connected', response.message);
    } catch (error) {
      Alert.alert('Zerodha connection failed', error instanceof Error ? error.message : 'Could not complete Zerodha authorization.');
    } finally {
      setBusy(null);
    }
  };

  const handleExploreAa = async () => {
    setBusy('aa');
    try {
      const status = await portfolioApi.getAccountAggregatorExploration();
      setAaStatus(status);
    } catch (error) {
      Alert.alert('Account Aggregator unavailable', error instanceof Error ? error.message : 'Could not load AA status.');
    } finally {
      setBusy(null);
    }
  };

  return {
    enabled,
    currencySymbol,
    accounts,
    holdings,
    lastUpdatedAt,
    overview,
    aiInsights,
    busy,
    busyAccountId,
    busyHoldingId,
    showManualEntry,
    showZerodhaSheet,
    aaStatus,
    zerodhaRequestToken,
    zerodhaState,
    zerodhaExpiresAt,
    zerodhaConnectMessage,
    zerodhaSetupItems,
    zerodhaSetupOnly,
    setShowManualEntry,
    setShowZerodhaSheet,
    setAaStatus,
    setZerodhaRequestToken,
    refreshPortfolio,
    handleManualSubmit,
    handleCreateManualAccount,
    handleSyncAccount,
    handlePauseAccount,
    handleDisconnectAccount,
    handleDeleteHolding,
    handleSnapshot,
    handleGenerateAiInsights,
    handleStartZerodha,
    handleCompleteZerodha,
    handleExploreAa,
  };
}
