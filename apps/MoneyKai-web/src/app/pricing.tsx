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
    name: 'Free',
    price: '₹0',
    note: 'For building a calm, consistent money-review habit without a subscription.',
    cta: 'Create an account',
    highlighted: true,
    planKey: null,
    features: ['Manual transactions', 'Budget workspace', 'Savings and shared expense views', 'Export your records'],
  },
  {
    name: 'Plus',
    price: '₹249',
    note: 'Planned for richer monthly context when the next MoneyKai release is ready.',
    cta: 'Join the Plus waitlist',
    highlighted: false,
    planKey: 'plus',
    features: ['Everything in Free', 'Expanded review workflows', 'More report context', 'Priority feature access'],
  },
  {
    name: 'Premium',
    price: '₹449',
    note: 'Planned for the most complete MoneyKai workspace as premium limits are finalized.',
    cta: 'Join the Premium waitlist',
    highlighted: false,
    planKey: 'premium',
    features: ['Everything in Plus', 'Advanced reports', 'Portfolio review depth', 'Premium support path'],
  },
] as const;

const VALUE_MOMENTS = [
  {
    icon: 'web',
    title: 'Web release in progress',
    body: 'MoneyKai does not have an Android release today. The first public web experience is being prepared.',
  },
  {
    icon: 'chart-box-outline',
    title: 'Pricing is clear before launch',
    body: 'Free, Plus, and Premium are shown now so the planned scope is easy to understand.',
  },
  {
    icon: 'file-lock-outline',
    title: 'No charge today',
    body: 'Paid plans are not yet available to purchase. We will announce availability before checkout opens.',
  },
] as const;

const TRUST_MARKERS = [
  {
    icon: 'credit-card-off-outline',
    title: 'No checkout today',
    body: 'There are no subscriptions, in-app purchases, or payment processing available today.',
  },
  {
    icon: 'cloud-off-outline',
    title: 'No Android release',
    body: 'MoneyKai is not currently available as an Android app.',
  },
  {
    icon: 'robot-off-outline',
    title: 'No financial advice',
    body: 'MoneyKai does not provide investment, tax, legal, or other financial advice.',
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
        title="MoneyKai Pricing | Upcoming web plans"
        description="MoneyKai is preparing a web release with Free, Plus, and Premium plans. Paid plans are not yet available to purchase, and there is no Android release today."
        path="/pricing"
        keywords={['MoneyKai pricing', 'upcoming budget app', 'money review plans']}
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
              UPCOMING WEB RELEASE
            </Text>
            <Text style={{ maxWidth: 880, fontSize: isWide ? 52 : 36, lineHeight: isWide ? 58 : 42, fontFamily: Typography.fontFamily.display, color: '#FFFFFF' }}>
              Clear pricing, before launch.
            </Text>
            <Text style={{ maxWidth: 720, fontSize: Typography.fontSize.md, lineHeight: 26, color: 'rgba(255,255,255,0.74)' }}>
              MoneyKai is preparing its first public web experience. Free, Plus, and Premium are planned; paid access is not available to purchase today.
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
                      {plan.name === 'Free' ? 'Available at launch' : 'Coming soon'}
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
                  WHAT HAPPENS NEXT
                </Text>
              <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize['2xl'], lineHeight: 34, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                  We will publish plan availability before paid access opens.
                </Text>
                <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  Before MoneyKai opens subscriptions, payments, cloud sync, Gmail sync, SMS capture, bank sync, or AI features, the app behavior, privacy policy, and public product copy will be updated together.
                </Text>
                <Button
                  title="Create an account"
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
                ['No Android app today', 'MoneyKai is not currently available as an Android release.'],
                ['No paid checkout today', 'Plan prices are public, but subscriptions and payment processing are not available.'],
                ['Plans are marked by availability', 'Free begins at launch; Plus and Premium are explicitly marked as coming soon.'],
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
