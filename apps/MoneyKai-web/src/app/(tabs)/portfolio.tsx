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
import { Spacing, Typography } from '@/constants/theme';
import { usePortfolioWorkspace } from '@/features/wealth/usePortfolioWorkspace';
import { useTheme } from '@/hooks/useTheme';

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
        <View style={{ gap: Spacing.xs }}>
          <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
            Portfolio
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
            {lastUpdatedAt ? `Last updated ${new Date(lastUpdatedAt).toLocaleString()}` : 'No portfolio data synced yet'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingTop: Spacing.sm }}>
            <Button title="Refresh" icon="refresh" onPress={refreshPortfolio} loading={busy === 'refresh'} size="sm" />
            <Button title="Add Holding" icon="plus" onPress={() => setShowManualEntry(true)} size="sm" variant="outline" />
            <Button title="Snapshot" icon="camera-outline" onPress={handleSnapshot} loading={busy === 'snapshot'} size="sm" variant="outline" />
            <Button title="Wealth" icon="chart-line" onPress={() => router.push('/(tabs)/wealth' as never)} size="sm" variant="outline" />
          </View>
        </View>

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
        title="Complete Zerodha"
        subtitle="Authorize in Zerodha, then paste the request token here to finish connecting this broker account."
        onClose={() => setShowZerodhaSheet(false)}
        footer={
          <View style={{ gap: Spacing.sm }}>
            <Button title="Complete Connection" icon="check-circle-outline" loading={busy === 'zerodha'} onPress={handleCompleteZerodha} />
            <Button title="Close" onPress={() => setShowZerodhaSheet(false)} variant="outline" />
          </View>
        }
      >
        <View style={{ gap: Spacing.md }}>
          {zerodhaExpiresAt ? (
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
              Authorization expires at {new Date(zerodhaExpiresAt).toLocaleString()}
            </Text>
          ) : null}
          <Input
            label="Request token"
            placeholder="Paste Zerodha request token"
            value={zerodhaRequestToken}
            onChangeText={setZerodhaRequestToken}
            autoCapitalize="none"
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
