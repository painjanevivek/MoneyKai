import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { billingApi, type BillingPlanKey, type BillingStatus } from '@/services/billingApi';

const PLANS = [
  {
    name: 'Start',
    price: 'Free',
    note: 'For personal review and early financial organization.',
    cta: 'Create account',
    highlighted: true,
    planKey: null,
    features: ['Manual transactions', 'Budget workspace', 'Statement review', 'Private reports', 'Portfolio records'],
  },
  {
    name: 'Premium',
    price: 'Secure checkout',
    note: 'For deeper automation, richer AI review, and advanced reporting. Final price is shown in Stripe Checkout.',
    cta: 'Upgrade with Stripe',
    highlighted: false,
    planKey: 'premium_monthly',
    features: ['Advanced AI summaries', 'More import capacity', 'Wealth review workflows', 'Priority product updates', 'Self-service billing portal'],
  },
] as const;

const VALUE_MOMENTS = [
  {
    icon: 'database-import-outline',
    title: 'When imports save time',
    body: 'Upgrade paths should unlock more review capacity after users have seen statement and manual-entry workflows work.',
  },
  {
    icon: 'chart-box-outline',
    title: 'When patterns become decisions',
    body: 'Advanced reports belong after a user has enough categories, budgets, and monthly history to compare.',
  },
  {
    icon: 'briefcase-outline',
    title: 'When wealth context matters',
    body: 'Portfolio review is most valuable once spending and liquidity are visible beside holdings and exposure.',
  },
] as const;

const TRUST_MARKERS = [
  {
    icon: 'credit-card-lock-outline',
    title: 'Stripe-hosted checkout',
    body: 'Payment details are collected by Stripe, not stored in MoneyKai client code.',
  },
  {
    icon: 'receipt-text-check-outline',
    title: 'Manage billing anytime',
    body: 'Subscribers can update payment methods, view invoices, and change billing details in the Customer Portal.',
  },
  {
    icon: 'alert-circle-check-outline',
    title: 'Payment recovery path',
    body: 'Past-due users are guided back to the billing portal instead of hitting a silent product lock.',
  },
] as const;

const isAllowedStripeRedirect = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ['checkout.stripe.com', 'billing.stripe.com'].includes(parsed.hostname);
  } catch {
    return false;
  }
};

const redirectTo = (url: string) => {
  if (!isAllowedStripeRedirect(url)) {
    throw new Error('Billing returned an unexpected redirect URL.');
  }

  if (typeof window !== 'undefined') {
    window.location.assign(url);
  }
};

const statusCopy = (status: BillingStatus | null): string => {
  if (!status || status.status === 'none' || status.status === 'canceled') {
    return 'Free plan active';
  }

  if (status.status === 'past_due' || status.status === 'unpaid') {
    return 'Payment needs attention';
  }

  if (status.status === 'incomplete') {
    return 'Checkout is incomplete';
  }

  if (status.status === 'trialing') {
    return 'Premium trial active';
  }

  return 'Premium active';
};

export default function PricingPage() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { checkout } = useLocalSearchParams<{ checkout?: string }>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isWide = width >= 900;
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [billingMessage, setBillingMessage] = useState('');
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<BillingPlanKey | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const checkoutMessage =
    checkout === 'success'
      ? 'Checkout completed. Premium access updates after Stripe confirms the subscription event.'
      : checkout === 'cancelled'
        ? 'Checkout was cancelled. No payment method was changed.'
        : '';
  const visibleBillingMessage = billingMessage || checkoutMessage;
  const visibleBillingStatus = isAuthenticated ? billingStatus : null;

  useEffect(() => {
    let mounted = true;

    if (!isAuthenticated) {
      return () => {
        mounted = false;
      };
    }

    billingApi
      .getStatus()
      .then((status) => {
        if (mounted) {
          setBillingStatus(status);
        }
      })
      .catch((error) => {
        if (mounted) {
          setBillingMessage(error instanceof Error ? error.message : 'Billing status is unavailable.');
        }
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const handlePlanPress = async (planKey: BillingPlanKey | null) => {
    if (!isAuthenticated) {
      router.push('/(auth)/signup');
      return;
    }

    if (!planKey) {
      router.push('/dashboard' as any);
      return;
    }

    setBillingMessage('');
    setCheckoutLoadingPlan(planKey);
    try {
      const session = await billingApi.createCheckoutSession(planKey);
      redirectTo(session.url);
    } catch (error) {
      setBillingMessage(error instanceof Error ? error.message : 'Unable to start Stripe Checkout.');
    } finally {
      setCheckoutLoadingPlan(null);
    }
  };

  const handlePortalPress = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    setBillingMessage('');
    setPortalLoading(true);
    try {
      const session = await billingApi.createPortalSession();
      redirectTo(session.url);
    } catch (error) {
      setBillingMessage(error instanceof Error ? error.message : 'Unable to open the billing portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <>
      <SeoHead
        title="MoneyKai Pricing | Start free with private finance reports"
        description="Start MoneyKai free and review budgets, transactions, statements, and portfolio records before premium reporting plans arrive."
        path="/pricing"
        keywords={['MoneyKai pricing', 'private finance reports pricing', 'budget app pricing']}
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
              SIMPLE PRICING
            </Text>
            <Text style={{ maxWidth: 880, fontSize: isWide ? 52 : 36, lineHeight: isWide ? 58 : 42, fontFamily: Typography.fontFamily.display, color: '#FFFFFF' }}>
              Start free. Upgrade only when deeper reporting is worth it.
            </Text>
            <Text style={{ maxWidth: 720, fontSize: Typography.fontSize.md, lineHeight: 26, color: 'rgba(255,255,255,0.74)' }}>
              MoneyKai is priced around trust: start free, upgrade through Stripe-hosted checkout, and manage payment details without exposing card data to the app.
            </Text>
          </View>

          {(isAuthenticated || visibleBillingMessage) ? (
            <SectionCard>
              <View style={{ flexDirection: isWide ? 'row' : 'column', alignItems: isWide ? 'center' : 'stretch', justifyContent: 'space-between', gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
                    BILLING STATUS
                  </Text>
                  <Text style={{ marginTop: 6, fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                    {statusCopy(visibleBillingStatus)}
                  </Text>
                  {visibleBillingMessage ? (
                    <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                      {visibleBillingMessage}
                    </Text>
                  ) : null}
                </View>
                {isAuthenticated ? (
                  <Button
                    title="Manage billing"
                    onPress={handlePortalPress}
                    icon="receipt-text-outline"
                    variant="outline"
                    loading={portalLoading}
                    disabled={visibleBillingStatus?.status === 'none'}
                  />
                ) : null}
              </View>
            </SectionCard>
          ) : null}

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
                  {plan.highlighted ? (
                    <View style={{ paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: colors.primaryBg }}>
                      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
                        Best first step
                      </Text>
                    </View>
                  ) : null}
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
                  title={!isAuthenticated && plan.planKey ? 'Sign in to upgrade' : plan.cta}
                  onPress={() => handlePlanPress(plan.planKey)}
                  icon={plan.highlighted ? 'shield-account-outline' : 'arrow-right'}
                  size="lg"
                  variant={plan.highlighted ? 'primary' : 'outline'}
                  loading={checkoutLoadingPlan === plan.planKey}
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
                  Premium should appear after MoneyKai creates value.
                </Text>
                <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  The free plan keeps activation simple. Premium moments are framed around clear limits, richer analysis, and workflows users already understand.
                </Text>
                <Button
                  title="Start the free review loop"
                  onPress={() => router.push((isAuthenticated ? '/dashboard' : '/(auth)/signup') as any)}
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
                ['No confusing plan maze', 'The free entry point remains easy to understand.'],
                ['No card handling in the app', 'Checkout and payment-method updates happen on Stripe-hosted pages.'],
                ['No silent failed payments', 'Past-due states route users to a clear billing recovery action.'],
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
