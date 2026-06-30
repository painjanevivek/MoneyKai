import React from 'react';
import { router } from 'expo-router';
import { Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const PLANS = [
  {
    name: 'Current Android release',
    price: 'Free',
    note: 'For local personal expense and budget tracking on your device.',
    cta: 'Open app',
    highlighted: true,
    planKey: null,
    features: ['Manual transactions', 'Budget workspace', 'Savings and trend insights', 'Local diagnostics', 'Encrypted backup files'],
  },
] as const;

const VALUE_MOMENTS = [
  {
    icon: 'cellphone-check',
    title: 'Local-first scope',
    body: 'The Android release stores finance records on the device and does not include backend sync or account billing.',
  },
  {
    icon: 'chart-box-outline',
    title: 'Manual records first',
    body: 'Transactions, budgets, and summaries are based on what the user enters locally.',
  },
  {
    icon: 'file-lock-outline',
    title: 'Backup files by choice',
    body: 'Users can export plaintext JSON to the clipboard or create a password-encrypted backup file through device flows.',
  },
] as const;

const TRUST_MARKERS = [
  {
    icon: 'credit-card-off-outline',
    title: 'No Android payments',
    body: 'The current Android release does not include in-app purchases, subscriptions, checkout, or payment processing.',
  },
  {
    icon: 'cloud-off-outline',
    title: 'No cloud backup',
    body: 'The current Android release does not use Firebase cloud backup or MoneyKai backend sync.',
  },
  {
    icon: 'robot-off-outline',
    title: 'No Financial AI',
    body: 'The current Android release does not provide AI financial review, classification, investment, tax, or legal advice.',
  },
] as const;

export default function PricingPage() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const handlePlanPress = () => {
    router.push('/(auth)/signup');
  };

  return (
    <>
      <SeoHead
        title="MoneyKai Pricing | Current Android release scope"
        description="The current MoneyKai Android release is free and local-first, with manual tracking, budgets, savings insights, diagnostics, and encrypted backup files."
        path="/pricing"
        keywords={['MoneyKai pricing', 'free budget app', 'local expense tracker']}
      />
      <PublicShell>
        <View style={{ gap: Spacing['4xl'] }}>
          <View
            style={{
              borderRadius: BorderRadius.xl,
              padding: isWide ? Spacing['4xl'] : Spacing.xl,
              backgroundColor: colors.primaryDark,
              borderWidth: 1,
              borderColor: 'rgba(234,246,240,0.16)',
              gap: Spacing.lg,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: 'rgba(255,255,255,0.66)' }}>
              CURRENT ANDROID RELEASE
            </Text>
            <Text style={{ maxWidth: 880, fontSize: isWide ? 52 : 36, lineHeight: isWide ? 58 : 42, fontFamily: Typography.fontFamily.display, color: '#FFFFFF' }}>
              Free local tracking. No paid Android plan in this release.
            </Text>
            <Text style={{ maxWidth: 720, fontSize: Typography.fontSize.md, lineHeight: 26, color: 'rgba(255,255,255,0.74)' }}>
              MoneyKai 1.0.1 focuses on local expense tracking, budgeting, savings visibility, local diagnostics, and user-controlled encrypted backup files.
            </Text>
          </View>

          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
            {PLANS.map((plan) => (
              <SectionCard
                key={plan.name}
                style={{
                  flex: 1,
                  borderColor: plan.highlighted ? `${colors.primary}44` : colors.borderLight,
                  backgroundColor: plan.highlighted ? colors.surfaceElevated : colors.card,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md }}>
                  <View>
                    <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                      {plan.name}
                    </Text>
                    <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize['3xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
                      {plan.price}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: colors.primaryBg }}>
                    <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
                      Play-safe scope
                    </Text>
                  </View>
                </View>
                <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  {plan.note}
                </Text>
                <View style={{ gap: Spacing.sm, marginTop: Spacing.lg }}>
                  {plan.features.map((feature) => (
                    <View key={feature} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.primary} />
                      <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: colors.textPrimary }}>{feature}</Text>
                    </View>
                  ))}
                </View>
                <Button
                  title={plan.cta}
                  onPress={handlePlanPress}
                  icon={plan.highlighted ? 'shield-account-outline' : 'arrow-right'}
                  size="lg"
                  variant={plan.highlighted ? 'primary' : 'outline'}
                  testID={plan.highlighted ? 'pricing-start-cta' : 'pricing-premium-cta'}
                  style={{ marginTop: Spacing.xl }}
                />
              </SectionCard>
            ))}
          </View>

          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
            {TRUST_MARKERS.map((item) => (
              <SectionCard key={item.title} style={{ flex: 1 }}>
                <View style={{ width: 44, height: 44, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryBg }}>
                  <MaterialCommunityIcons name={item.icon} size={21} color={colors.primary} />
                </View>
                <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {item.title}
                </Text>
                <Text style={{ marginTop: 6, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  {item.body}
                </Text>
              </SectionCard>
            ))}
          </View>

          <SectionCard>
            <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.xl, alignItems: isWide ? 'center' : 'stretch' }}>
              <View style={{ flex: 0.9 }}>
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
                  UPGRADE PATH
                </Text>
              <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize['2xl'], lineHeight: 34, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                  Future paid or cloud features need a fresh policy review.
                </Text>
                <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  Before MoneyKai ships subscriptions, payments, cloud sync, Gmail sync, SMS capture, bank sync, or AI features, the app behavior, privacy policy, Play declarations, and store listing must be updated together.
                </Text>
                <Button
                  title="Open MoneyKai"
                  onPress={() => router.push('/(auth)/signup')}
                  icon="arrow-right"
                  iconPosition="right"
                  testID="pricing-free-review-cta"
                  style={{ marginTop: Spacing.lg }}
                />
              </View>
              <View style={{ flex: 1.1, gap: Spacing.sm }}>
                {VALUE_MOMENTS.map((moment) => (
                  <View
                    key={moment.title}
                    style={{
                      flexDirection: 'row',
                      gap: Spacing.md,
                      padding: Spacing.md,
                      borderRadius: BorderRadius.sm,
                      backgroundColor: colors.surfaceElevated,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                    }}
                  >
                    <View style={{ width: 42, height: 42, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryBg }}>
                      <MaterialCommunityIcons name={moment.icon} size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        {moment.title}
                      </Text>
                      <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                        {moment.body}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </SectionCard>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              What stays clear
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.lg }}>
              {[
                ['No paid tiers in Android release', 'The public Android copy should not imply subscriptions or in-app purchases.'],
                ['No card handling in the app', 'The current Android build does not collect payment details.'],
                ['No cloud entitlement checks', 'There is no remote account service or backend gate in this release.'],
              ].map(([title, body]) => (
                <View key={title} style={{ flexBasis: 240, flexGrow: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{title}</Text>
                  <Text style={{ marginTop: 6, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>{body}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        </View>
      </PublicShell>
    </>
  );
}
