import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AssetAllocationChart } from '@/components/portfolio/AssetAllocationChart';
import { HoldingsList } from '@/components/portfolio/HoldingsList';
import { PortfolioInsightCard } from '@/components/portfolio/PortfolioInsightCard';
import { PortfolioSummaryCard } from '@/components/portfolio/PortfolioSummaryCard';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography } from '@/constants/theme';
import { usePortfolioWorkspace } from '@/features/wealth/usePortfolioWorkspace';
import { useTheme } from '@/hooks/useTheme';

export default function WealthScreen() {
  const { colors } = useTheme();
  const {
    enabled,
    currencySymbol,
    holdings,
    lastUpdatedAt,
    overview,
    aiInsights,
    busy,
    refreshPortfolio,
    handleSnapshot,
    handleGenerateAiInsights,
  } = usePortfolioWorkspace();

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
        <View style={{ gap: Spacing.xs }}>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
            {lastUpdatedAt ? `Last updated ${new Date(lastUpdatedAt).toLocaleString()}` : 'No wealth data synced yet'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingTop: Spacing.sm }}>
            <Button title="Refresh" icon="refresh" onPress={refreshPortfolio} loading={busy === 'refresh'} size="sm" />
            <Button title="Snapshot" icon="camera-outline" onPress={handleSnapshot} loading={busy === 'snapshot'} size="sm" variant="outline" />
            <Button
              title="Portfolio"
              icon="briefcase-outline"
              onPress={() => router.push('/portfolio')}
              size="sm"
              variant="outline"
            />
          </View>
        </View>

        <PortfolioSummaryCard snapshot={overview.snapshot} currencySymbol={currencySymbol} />
        <AssetAllocationChart allocation={overview.allocation} currencySymbol={currencySymbol} />
        <HoldingsList holdings={overview.topHoldings} currencySymbol={currencySymbol} />
        {holdings.length > overview.topHoldings.length ? (
          <Button
            title="View All Holdings"
            icon="format-list-bulleted"
            variant="outline"
            onPress={() => router.push('/portfolio')}
          />
        ) : null}
        <PortfolioInsightCard
          insights={overview.insights}
          aiInsights={aiInsights}
          loadingAiInsights={busy === 'ai'}
          onGenerateAiInsights={handleGenerateAiInsights}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
