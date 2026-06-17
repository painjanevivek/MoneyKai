import React from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AssetAllocationChart } from '@/components/portfolio/AssetAllocationChart';
import { HoldingsList } from '@/components/portfolio/HoldingsList';
import { ManualHoldingSheet } from '@/components/portfolio/ManualHoldingSheet';
import { PortfolioSummaryCard } from '@/components/portfolio/PortfolioSummaryCard';
import { ProviderConnectionCard } from '@/components/portfolio/ProviderConnectionCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { WorkspaceHeader } from '@/components/ui/WorkspaceHeader';
import { Spacing, Typography } from '@/constants/theme';
import { usePortfolioWorkspace } from '@/features/wealth/usePortfolioWorkspace';
import { useTheme } from '@/hooks/useTheme';

const isHttpsUrl = (url: string) => {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
};

export default function PortfolioScreen() {
  const { colors } = useTheme();
  const {
    enabled,
    currencySymbol,
    accounts,
    holdings,
    lastUpdatedAt,
    overview,
    busy,
    busyAccountId,
    busyHoldingId,
    showManualEntry,
    showZerodhaSheet,
    aaStatus,
    zerodhaRequestToken,
    zerodhaExpiresAt,
    zerodhaMode,
    zerodhaConnectMessage,
    zerodhaSetupItems,
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
    handleStartZerodha,
    handleCompleteZerodha,
    handleExploreAa,
  } = usePortfolioWorkspace();

  React.useEffect(() => {
    if (!enabled) {
      router.replace('/(tabs)');
    }
  }, [enabled]);

  if (!enabled) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[]} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: Spacing['2xl'], gap: Spacing.base }}
      >
        <WorkspaceHeader
          icon="briefcase-outline"
          eyebrow="WEALTH WORKSPACE"
          title="Portfolio review"
          description={lastUpdatedAt ? `Last updated ${new Date(lastUpdatedAt).toLocaleString()}` : 'Add holdings or connect a provider before portfolio insights become useful.'}
          metrics={[
            { label: 'Accounts', value: String(accounts.length) },
            { label: 'Holdings', value: String(holdings.length) },
            { label: 'Status', value: busy ? 'Syncing' : 'Ready', tone: busy ? 'warning' : 'positive' },
          ]}
          chips={[
            { icon: 'shield-check-outline', label: 'Manual review' },
            { icon: 'bank-transfer', label: aaStatus ? 'AA status open' : 'Consented data only' },
          ]}
          actions={
            <>
              <Button title="Refresh" icon="refresh" onPress={refreshPortfolio} loading={busy === 'refresh'} size="sm" variant="outline" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)' }} />
              <Button title="Add Holding" icon="plus" onPress={() => setShowManualEntry(true)} size="sm" variant="outline" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)' }} />
              <Button title="Snapshot" icon="camera-outline" onPress={handleSnapshot} loading={busy === 'snapshot'} size="sm" variant="outline" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)' }} />
              <Button title="Wealth" icon="chart-line" onPress={() => router.push('/(tabs)/wealth' as never)} size="sm" variant="outline" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(255,255,255,0.3)' }} />
            </>
          }
        />

        <PortfolioSummaryCard snapshot={overview.snapshot} currencySymbol={currencySymbol} />
        <ProviderConnectionCard
          accounts={accounts}
          busyAccountId={busyAccountId}
          onAddManual={() => setShowManualEntry(true)}
          onCreateManualAccount={handleCreateManualAccount}
          onStartZerodha={handleStartZerodha}
          onExploreAccountAggregator={handleExploreAa}
          onSync={handleSyncAccount}
          onPause={handlePauseAccount}
          onDisconnect={handleDisconnectAccount}
        />
        <AssetAllocationChart allocation={overview.allocation} currencySymbol={currencySymbol} />
        <HoldingsList
          holdings={holdings}
          title="All holdings"
          currencySymbol={currencySymbol}
          busyHoldingId={busyHoldingId}
          onDelete={handleDeleteHolding}
        />
      </ScrollView>
      {showManualEntry ? (
        <ManualHoldingSheet
          visible
          currencySymbol={currencySymbol}
          loading={busy === 'manual'}
          onClose={() => setShowManualEntry(false)}
          onSubmit={handleManualSubmit}
        />
      ) : null}
      <ModalSheet
        visible={showZerodhaSheet}
        title={zerodhaMode === 'local_sandbox' ? 'Zerodha sandbox' : 'Complete Zerodha'}
        subtitle={
          zerodhaMode === 'local_sandbox'
            ? 'Production Kite credentials are not configured yet. Complete this local broker account to test holdings, sync, and review flows.'
            : 'Authorize in Zerodha, then paste the request token here to finish connecting this broker account.'
        }
        onClose={() => setShowZerodhaSheet(false)}
        footer={
          <View style={{ gap: Spacing.sm }}>
            <Button
              title={zerodhaMode === 'local_sandbox' ? 'Connect Sandbox' : 'Complete Connection'}
              icon="check-circle-outline"
              loading={busy === 'zerodha'}
              onPress={handleCompleteZerodha}
            />
            <Button title="Close" onPress={() => setShowZerodhaSheet(false)} variant="outline" />
          </View>
        }
      >
        <View style={{ gap: Spacing.md }}>
          {zerodhaConnectMessage ? (
            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
              {zerodhaConnectMessage}
            </Text>
          ) : null}
          {zerodhaExpiresAt ? (
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
              Authorization expires at {new Date(zerodhaExpiresAt).toLocaleString()}
            </Text>
          ) : null}
          {zerodhaSetupItems.length > 0 ? (
            <View style={{ gap: Spacing.xs }}>
              {zerodhaSetupItems.map((item) => (
                <View key={item} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                  <Text style={{ color: colors.primary }}>-</Text>
                  <Text style={{ flex: 1, fontSize: Typography.fontSize.xs, color: colors.textTertiary, lineHeight: 16 }}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          <Input
            label={zerodhaMode === 'local_sandbox' ? 'Sandbox token' : 'Request token'}
            placeholder={zerodhaMode === 'local_sandbox' ? 'Generated locally' : 'Paste Zerodha request token'}
            value={zerodhaRequestToken}
            onChangeText={setZerodhaRequestToken}
            autoCapitalize="none"
            autoCorrect={false}
            editable={zerodhaMode !== 'local_sandbox'}
          />
        </View>
      </ModalSheet>
      <ModalSheet
        visible={Boolean(aaStatus)}
        title="Account Aggregator"
        subtitle="Exploratory provider status for consented financial data sharing."
        onClose={() => setAaStatus(null)}
        footer={
          <View style={{ gap: Spacing.sm }}>
            {aaStatus?.partnerUrl ? (
              <Button
                title="Open Partner"
                icon="open-in-new"
                onPress={() => {
                  if (!isHttpsUrl(aaStatus.partnerUrl!)) {
                    Alert.alert('Partner URL blocked', 'MoneyKai only opens secure HTTPS partner links.');
                    return;
                  }
                  void Linking.openURL(aaStatus.partnerUrl!).catch(() => {
                    Alert.alert('Partner URL', aaStatus.partnerUrl!);
                  });
                }}
              />
            ) : null}
            <Button title="Close" onPress={() => setAaStatus(null)} variant="outline" />
          </View>
        }
      >
        <View style={{ gap: Spacing.md }}>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
            {aaStatus?.productionReady
              ? 'A production Account Aggregator path is configured.'
              : 'Production AA connectivity requires an FIU/TSP partner and consent-flow onboarding.'}
          </Text>
          {aaStatus?.readinessAccountId ? (
            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textPrimary, lineHeight: 20 }}>
              Readiness tracker added to Connected accounts.
            </Text>
          ) : null}
          {aaStatus?.partnerName ? (
            <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textPrimary }}>
              Partner: {aaStatus.partnerName}
            </Text>
          ) : null}
          {aaStatus?.decisionLockedAt ? (
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
              Decision locked at {new Date(aaStatus.decisionLockedAt).toLocaleString()}
            </Text>
          ) : null}
          {aaStatus?.checklist.map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
              <Text style={{ color: colors.primary }}>-</Text>
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
