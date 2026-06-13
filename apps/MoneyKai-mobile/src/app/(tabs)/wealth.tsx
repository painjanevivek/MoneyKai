import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AssetAllocationChart } from '@/components/portfolio/AssetAllocationChart';
import { HoldingsList } from '@/components/portfolio/HoldingsList';
import { PortfolioInsightCard } from '@/components/portfolio/PortfolioInsightCard';
import { PortfolioSummaryCard } from '@/components/portfolio/PortfolioSummaryCard';
import { ProviderConnectionCard } from '@/components/portfolio/ProviderConnectionCard';
import { Card } from '@/components/ui/Card';
import { isWealthTabEnabled } from '@/config/environment';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

export default function WealthScreen() {
  const { colors } = useTheme();
  const enabled = isWealthTabEnabled();
  const user = useAuthStore((state) => state.user);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const accounts = usePortfolioStore((state) => state.accounts);
  const lastUpdatedAt = usePortfolioStore((state) => state.lastUpdatedAt);
  const overview = usePortfolioStore((state) => state.getWealthOverview(user?.id ?? 'local'));

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
        <HoldingsList holdings={overview.topHoldings} currencySymbol={currencySymbol} />
        <ProviderConnectionCard accounts={accounts} enabled={enabled} />
        <PortfolioInsightCard insights={overview.insights} />
      </ScrollView>
    </SafeAreaView>
  );
}
