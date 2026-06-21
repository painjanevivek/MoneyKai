import React from 'react';
import { Linking, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { billingApi, type BillingPlanKey, type BillingStatus } from '@/services/billingApi';
import { useTheme } from '@/hooks/useTheme';

type SubscriptionPlan = {
  key: 'free' | 'plus' | 'premium';
  name: string;
  price: string;
  label: string;
  description: string;
  badge?: string;
  icon: string;
  tone: 'default' | 'gold';
  planKey: BillingPlanKey | null;
  inclusions: string[];
};

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    key: 'free',
    name: 'Free',
    price: 'Rs. 0',
    label: 'per month',
    description: 'For starting with manual records and basic review habits.',
    badge: 'Current starter',
    icon: 'wallet-outline',
    tone: 'default',
    planKey: null,
    inclusions: ['Core dashboard', 'Manual transactions', 'Monthly budget basics', 'Private local review'],
  },
  {
    key: 'plus',
    name: 'Plus',
    price: 'Rs. 249',
    label: 'per month',
    description: 'For stronger review workflows and richer monthly context.',
    badge: 'MoneyKai+',
    icon: 'crown-outline',
    tone: 'gold',
    planKey: 'premium_monthly',
    inclusions: ['Everything in Free', 'Expanded AI review', 'More report context', 'Priority feature access'],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: 'Rs. 449',
    label: 'per month',
    description: 'For the deepest MoneyKai workspace when premium limits are finalized.',
    badge: 'Most complete',
    icon: 'diamond-stone',
    tone: 'gold',
    planKey: 'premium_annual',
    inclusions: ['Everything in Plus', 'Advanced reports', 'Portfolio review depth', 'Premium support path'],
  },
];

const isStripeHostedUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && ['checkout.stripe.com', 'billing.stripe.com'].includes(parsed.hostname);
  } catch {
    return false;
  }
};

const billingLabel = (status: BillingStatus | null): string => {
  if (!status || status.status === 'none') {
    return 'Free plan active';
  }

  if (status.status === 'active' || status.status === 'trialing') {
    return status.cancelAtPeriodEnd ? 'Premium active until period end' : 'Premium active';
  }

  if (status.status === 'past_due' || status.status === 'unpaid' || status.status === 'incomplete') {
    return 'Billing needs attention';
  }

  return 'Free plan active';
};

export function SubscriptionsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const [billingStatus, setBillingStatus] = React.useState<BillingStatus | null>(null);
  const [statusLoading, setStatusLoading] = React.useState(true);
  const [loadingPlan, setLoadingPlan] = React.useState<BillingPlanKey | 'portal' | null>(null);
  const [message, setMessage] = React.useState('');

  const loadStatus = React.useCallback(async () => {
    setStatusLoading(true);
    try {
      const status = await billingApi.getStatus();
      setBillingStatus(status);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to read subscription status.');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const openBillingUrl = async (url: string) => {
    if (!isStripeHostedUrl(url)) {
      throw new Error('Billing returned an unexpected checkout link.');
    }

    await Linking.openURL(url);
  };

  const handlePlanPress = async (plan: SubscriptionPlan) => {
    if (!plan.planKey) {
      setMessage('You are already on the free starter plan.');
      return;
    }

    setLoadingPlan(plan.planKey);
    setMessage('');
    try {
      const session = await billingApi.createCheckoutSession(plan.planKey);
      await openBillingUrl(session.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start checkout.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    setLoadingPlan('portal');
    setMessage('');
    try {
      const session = await billingApi.createPortalSession();
      await openBillingUrl(session.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to open billing portal.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const isPremiumActive = billingStatus?.status === 'active' && billingStatus.plan !== 'free';
  const needsBillingAttention =
    billingStatus?.status === 'past_due' || billingStatus?.status === 'unpaid' || billingStatus?.status === 'incomplete';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['2xl'] }} showsVerticalScrollIndicator={false}>
        <ScreenBackButton />

        <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
          <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'] }}>
            Subscriptions
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 21 }}>
            Choose a plan, start Stripe-hosted checkout, or manage billing from your account.
          </Text>
        </View>

        <Card borderRadius="lg" style={{ gap: Spacing.md, marginBottom: Spacing.lg }}>
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.md }}>
            <View
              style={{
                alignItems: 'center',
                backgroundColor: needsBillingAttention ? `${colors.warning}22` : colors.primaryBg,
                borderRadius: BorderRadius.md,
                height: 48,
                justifyContent: 'center',
                width: 48,
              }}
            >
              <MaterialCommunityIcons
                name={needsBillingAttention ? 'alert-circle-outline' : 'shield-check-outline'}
                size={24}
                color={needsBillingAttention ? colors.warning : colors.primary}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md }}>
                {statusLoading ? 'Checking subscription' : billingLabel(billingStatus)}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, lineHeight: 18, marginTop: 3 }}>
                Billing is handled by MoneyKai backend and Stripe-hosted checkout.
              </Text>
            </View>
          </View>

          {isPremiumActive || needsBillingAttention ? (
            <Button
              title={needsBillingAttention ? 'Fix Billing' : 'Manage Billing'}
              icon="credit-card-outline"
              onPress={handleManageBilling}
              loading={loadingPlan === 'portal'}
              variant={needsBillingAttention ? 'primary' : 'outline'}
              fullWidth
            />
          ) : null}

          {message ? (
            <Text style={{ color: needsBillingAttention ? colors.warning : colors.textSecondary, fontSize: Typography.fontSize.xs, lineHeight: 18 }}>
              {message}
            </Text>
          ) : null}
        </Card>

        <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isGold = plan.tone === 'gold';
            const isCurrent =
              plan.key === 'free'
                ? !billingStatus || billingStatus.status === 'none' || billingStatus.status === 'canceled'
                : isPremiumActive;
            const accentColor = isGold ? '#F5C55A' : colors.primary;

            return (
              <Card
                key={plan.key}
                borderRadius="lg"
                padding="lg"
                style={{
                  backgroundColor: isGold ? 'rgba(60, 52, 28, 0.74)' : colors.card,
                  borderColor: isGold ? 'rgba(245, 197, 90, 0.44)' : colors.borderLight,
                  flex: isWide ? 1 : undefined,
                  gap: Spacing.lg,
                }}
              >
                <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md }}>
                  <View
                    style={{
                      alignItems: 'center',
                      backgroundColor: isGold ? 'rgba(245, 197, 90, 0.18)' : colors.primaryBg,
                      borderColor: isGold ? 'rgba(245, 197, 90, 0.36)' : colors.borderLight,
                      borderRadius: BorderRadius.md,
                      borderWidth: 1,
                      height: 48,
                      justifyContent: 'center',
                      width: 48,
                    }}
                  >
                    <MaterialCommunityIcons name={plan.icon} size={23} color={accentColor} />
                  </View>
                  {plan.badge ? (
                    <Text
                      numberOfLines={1}
                      style={{
                        backgroundColor: isGold ? 'rgba(245, 197, 90, 0.14)' : colors.primaryBg,
                        borderColor: isGold ? 'rgba(245, 197, 90, 0.34)' : colors.borderLight,
                        borderRadius: BorderRadius.full,
                        borderWidth: 1,
                        color: accentColor,
                        fontFamily: Typography.fontFamily.bold,
                        fontSize: Typography.fontSize.xs,
                        overflow: 'hidden',
                        paddingHorizontal: Spacing.sm,
                        paddingVertical: 6,
                      }}
                    >
                      {plan.badge}
                    </Text>
                  ) : null}
                </View>

                <View style={{ gap: Spacing.xs }}>
                  <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl }}>
                    {plan.name}
                  </Text>
                  <View style={{ alignItems: 'flex-end', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: 34, lineHeight: 40 }}>
                      {plan.price}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, paddingBottom: 5 }}>
                      {plan.label}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 21 }}>
                    {plan.description}
                  </Text>
                </View>

                <View style={{ gap: Spacing.sm }}>
                  {plan.inclusions.map((item) => (
                    <View key={item} style={{ alignItems: 'flex-start', flexDirection: 'row', gap: 10 }}>
                      <MaterialCommunityIcons name="check-circle-outline" size={18} color={isGold ? '#F5C55A' : colors.success} />
                      <Text style={{ color: colors.textSecondary, flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 20 }}>
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>

                <Button
                  title={isCurrent ? 'Current plan' : plan.key === 'free' ? 'Continue Free' : `Choose ${plan.name}`}
                  onPress={() => handlePlanPress(plan)}
                  variant={isGold ? 'primary' : 'outline'}
                  icon={isCurrent ? 'check-circle-outline' : plan.key === 'free' ? 'arrow-left' : 'arrow-right'}
                  iconPosition={isCurrent || plan.key === 'free' ? 'left' : 'right'}
                  loading={loadingPlan === plan.planKey}
                  disabled={isCurrent || loadingPlan !== null}
                  fullWidth
                />
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
