import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AssetAllocationChart } from '@/components/portfolio/AssetAllocationChart';
import { HoldingsList } from '@/components/portfolio/HoldingsList';
import { PortfolioInsightCard } from '@/components/portfolio/PortfolioInsightCard';
import { PortfolioSummaryCard } from '@/components/portfolio/PortfolioSummaryCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { usePortfolioWorkspace } from '@/features/wealth/usePortfolioWorkspace';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/formatCurrency';

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
  const wealthReview = React.useMemo(() => {
    const hasLiabilities = overview.snapshot.totalLiabilities > 0;
    const hasHoldings = holdings.length > 0;

    return {
      title: hasHoldings ? 'Position ready for review' : 'Add holdings to build position',
      tone: hasLiabilities ? colors.warning : hasHoldings ? colors.success : colors.textSecondary,
      body: hasHoldings
        ? 'MoneyKai is summarizing assets, liabilities, and investment value from tracked holdings. Treat AI notes as review prompts before making financial decisions.'
        : 'Connect a provider or add manual holdings so Wealth can show your larger financial position.',
      rows: [
        ['Net worth', formatCurrency(overview.snapshot.netWorth, currencySymbol)],
        ['Assets', formatCurrency(overview.snapshot.totalAssets, currencySymbol)],
        ['Liabilities', formatCurrency(overview.snapshot.totalLiabilities, currencySymbol)],
        ['Sources', `${overview.snapshot.sourceAccountCount} account${overview.snapshot.sourceAccountCount === 1 ? '' : 's'}`],
      ],
    };
  }, [colors.success, colors.textSecondary, colors.warning, currencySymbol, holdings.length, overview.snapshot]);

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
        <Card style={{ gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
            <View style={{ width: 38, height: 38, borderRadius: BorderRadius.sm, backgroundColor: `${wealthReview.tone}16`, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="scale-balance" size={19} color={wealthReview.tone} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                WEALTH REVIEW
              </Text>
              <Text style={{ marginTop: 3, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                {wealthReview.title}
              </Text>
              <Text style={{ marginTop: 4, fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
                {wealthReview.body}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {wealthReview.rows.map(([label, value]) => (
              <View key={label} style={{ flex: 1, minWidth: 135, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>{label}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 2, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {value}
                </Text>
              </View>
            ))}
          </View>
        </Card>
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
