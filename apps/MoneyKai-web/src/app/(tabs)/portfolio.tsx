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
import { ReviewSummaryCard } from '@/components/ui/ReviewSummaryCard';
import { WorkspaceHeader } from '@/components/ui/WorkspaceHeader';
import { Spacing, Typography } from '@/constants/theme';
import { usePortfolioWorkspace } from '@/features/wealth/usePortfolioWorkspace';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/formatCurrency';

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
    handleStartZerodha,
    handleCompleteZerodha,
    handleExploreAa,
  } = usePortfolioWorkspace();
  const portfolioReview = React.useMemo(() => {
    const totalValue = holdings.reduce((sum, holding) => sum + Math.max(holding.currentValue, 0), 0);
    const largestHolding = [...holdings].sort((a, b) => b.currentValue - a.currentValue)[0];
    const concentrationPercent = largestHolding && totalValue > 0 ? (largestHolding.currentValue / totalValue) * 100 : 0;
    const allocationCount = overview.allocation.length;
    const performancePositive = overview.snapshot.totalPnl >= 0;
    const needsConcentrationReview = concentrationPercent >= 50;

    return {
      title: holdings.length === 0 ? 'No holdings ready' : needsConcentrationReview ? 'Concentration needs review' : 'Holdings review is ready',
      tone: needsConcentrationReview ? 'warning' as const : holdings.length > 0 ? 'success' as const : 'neutral' as const,
      body: holdings.length === 0
        ? 'Add holdings or sync a provider before MoneyKai can compare allocation, performance, and concentration.'
        : `${largestHolding?.name ?? 'Top holding'} represents ${concentrationPercent.toFixed(0)}% of tracked portfolio value. This is a review note, not investment advice.`,
      rows: [
        ['Holdings', String(holdings.length)],
        ['Allocation groups', String(allocationCount)],
        ['Total P/L', `${performancePositive ? '+' : ''}${formatCurrency(overview.snapshot.totalPnl, currencySymbol)}`],
        ['Top exposure', largestHolding ? `${concentrationPercent.toFixed(0)}%` : 'None'],
      ],
    };
  }, [currencySymbol, holdings, overview.allocation.length, overview.snapshot.totalPnl]);

  React.useEffect(() => {
    if (!enabled) {
      router.replace('/dashboard');
    }
  }, [enabled]);

  if (!enabled) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[]} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={true}
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
              <Button title="Refresh" icon="refresh" onPress={refreshPortfolio} loading={busy === 'refresh'} size="sm" variant="outline" />
              <Button title="Add Holding" icon="plus" onPress={() => setShowManualEntry(true)} size="sm" variant="outline" />
              <Button title="Snapshot" icon="camera-outline" onPress={handleSnapshot} loading={busy === 'snapshot'} size="sm" variant="outline" />
              <Button title="Wealth" icon="chart-line" onPress={() => router.push('/wealth')} size="sm" variant="outline" />
            </>
          }
        />

        <PortfolioSummaryCard snapshot={overview.snapshot} currencySymbol={currencySymbol} />
        <ReviewSummaryCard
          eyebrow="PORTFOLIO REVIEW"
          title={portfolioReview.title}
          body={portfolioReview.body}
          icon="chart-donut"
          tone={portfolioReview.tone}
          rows={portfolioReview.rows}
        />
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
        title={zerodhaSetupOnly ? 'Broker setup required' : 'Complete Zerodha'}
        subtitle={
          zerodhaSetupOnly
            ? 'Live broker sync needs backend credentials, callback routes, and provider review before users can connect real accounts.'
            : 'Authorize in Zerodha, then paste the request token here to finish connecting this broker account.'
        }
        onClose={() => setShowZerodhaSheet(false)}
        footer={
          <View style={{ gap: Spacing.sm }}>
            {!zerodhaSetupOnly ? (
              <Button
                title="Complete Connection"
                icon="check-circle-outline"
                loading={busy === 'zerodha'}
                onPress={handleCompleteZerodha}
              />
            ) : null}
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
          {!zerodhaSetupOnly ? (
            <Input
              label="Request token"
              placeholder="Paste Zerodha request token"
              value={zerodhaRequestToken}
              onChangeText={setZerodhaRequestToken}
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : null}
        </View>
      </ModalSheet>
      <ModalSheet
        visible={Boolean(aaStatus)}
        title="Account Aggregator setup"
        subtitle="Production status for consented financial data sharing."
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
