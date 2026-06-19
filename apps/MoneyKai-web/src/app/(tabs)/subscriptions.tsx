import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { billingApi, type BillingStatus } from '@/services/billingApi';

type SubscriptionPlan = {
  key: 'free' | 'plus' | 'premium';
  name: string;
  price: string;
  label: string;
  description: string;
  badge?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tone: 'default' | 'gold';
  inclusions: string[];
};

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    key: 'free',
    name: 'Free',
    price: 'Rs. 0',
    label: 'per month',
    description: 'For starting with manual money tracking and basic review habits.',
    badge: 'Current starter',
    icon: 'wallet-outline',
    tone: 'default',
    inclusions: ['Core dashboard', 'Manual transactions', 'Monthly budget basics', 'Private local review'],
  },
  {
    key: 'plus',
    name: 'Plus',
    price: 'Rs. 249',
    label: 'per month',
    description: 'For users who want stronger review workflows and richer monthly context.',
    badge: 'MoneyKai+',
    icon: 'crown-outline',
    tone: 'gold',
    inclusions: ['Everything in Free', 'Expanded AI review', 'More report context', 'Priority feature access'],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: 'Rs. 449',
    label: 'per month',
    description: 'For power users who want the deepest MoneyKai workspace when premium limits are finalized.',
    badge: 'Most complete',
    icon: 'diamond-stone',
    tone: 'gold',
    inclusions: ['Everything in Plus', 'Advanced reports', 'Portfolio review depth', 'Premium support path'],
  },
];

const getStatusLabel = (status: BillingStatus | null) => {
  if (!status || status.status === 'none' || status.status === 'canceled') return 'Free plan active';
  if (status.status === 'past_due' || status.status === 'unpaid') return 'Payment needs attention';
  if (status.status === 'trialing') return 'Premium trial active';
  if (status.status === 'active') return 'Premium active';
  return 'Subscription status pending';
};

export default function SubscriptionsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 1080;
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [billingMessage, setBillingMessage] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    billingApi
      .getStatus()
      .then((status) => {
        if (mounted) setBillingStatus(status);
      })
      .catch((error) => {
        if (mounted) {
          setBillingMessage(error instanceof Error ? error.message : 'Billing status is unavailable.');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handlePlanPress = (plan: SubscriptionPlan) => {
    if (plan.key === 'free') {
      router.push('/dashboard' as any);
      return;
    }

    Alert.alert(
      `${plan.name} checkout`,
      'The plan structure is ready. Connect the final billing plan ID and inclusions before enabling paid checkout for users.'
    );
  };

  const handlePortalPress = async () => {
    setPortalLoading(true);
    setBillingMessage('');
    try {
      const session = await billingApi.createPortalSession();
      if (typeof window !== 'undefined') {
        window.location.assign(session.url);
      }
    } catch (error) {
      setBillingMessage(error instanceof Error ? error.message : 'Unable to open billing portal.');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ gap: Spacing.xl, paddingBottom: Spacing['2xl'] }} showsVerticalScrollIndicator={false}>
      <Card
        style={{
          gap: Spacing.lg,
          backgroundColor: colors.primaryDark,
          borderColor: `${colors.primaryLight}44`,
          padding: isWide ? Spacing['2xl'] : Spacing.xl,
        }}
        borderRadius="xl"
      >
        <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.lg, justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: Spacing.sm }}>
            <Text style={{ color: '#F5C55A', fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs }}>
              MONEYKAI PLANS
            </Text>
            <Text
              style={{
                color: '#FFFFFF',
                fontFamily: Typography.fontFamily.display,
                fontSize: isWide ? 44 : 32,
                lineHeight: isWide ? 50 : 38,
                maxWidth: 780,
              }}
            >
              Pick the right workspace before checkout goes live.
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.74)', fontSize: Typography.fontSize.base, lineHeight: 24, maxWidth: 760 }}>
              Free, Plus, and Premium are structured here now. Inclusions and live checkout can be connected once the final product limits are decided.
            </Text>
          </View>

          <Card
            style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderColor: 'rgba(255,255,255,0.2)',
              gap: 4,
              minWidth: isWide ? 280 : undefined,
            }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.66)', fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs }}>
              Account status
            </Text>
            <Text style={{ color: '#FFFFFF', fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl }}>
              {getStatusLabel(billingStatus)}
            </Text>
            {billingMessage ? (
              <Text style={{ color: '#FFE6A6', fontSize: Typography.fontSize.xs, lineHeight: 18 }}>{billingMessage}</Text>
            ) : null}
          </Card>
        </View>
      </Card>

      <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.base }}>
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isGold = plan.tone === 'gold';
          const isPremiumActive = billingStatus?.status === 'active' && billingStatus.plan !== 'free';
          const isCurrent =
            plan.key === 'free'
              ? !billingStatus || billingStatus.status === 'none' || billingStatus.status === 'canceled'
              : plan.key === 'premium' && isPremiumActive;

          return (
            <Card
              key={plan.key}
              style={{
                flex: 1,
                minWidth: isWide ? 0 : undefined,
                gap: Spacing.lg,
                borderColor: isGold ? 'rgba(245, 197, 90, 0.44)' : colors.glassBorder,
                backgroundColor: isGold ? 'rgba(60, 52, 28, 0.74)' : colors.glassBg,
              }}
              borderRadius="xl"
              padding="xl"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: BorderRadius.lg,
                    backgroundColor: isGold ? 'rgba(245, 197, 90, 0.18)' : colors.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: isGold ? 'rgba(245, 197, 90, 0.36)' : colors.glassBorder,
                  }}
                >
                  <MaterialCommunityIcons name={plan.icon} size={23} color={isGold ? '#F5C55A' : colors.primary} />
                </View>
                {plan.badge ? (
                  <View
                    style={{
                      borderRadius: BorderRadius.full,
                      paddingHorizontal: Spacing.sm,
                      paddingVertical: 6,
                      backgroundColor: isGold ? 'rgba(245, 197, 90, 0.14)' : colors.primaryBg,
                      borderWidth: 1,
                      borderColor: isGold ? 'rgba(245, 197, 90, 0.34)' : colors.glassBorder,
                    }}
                  >
                    <Text
                      style={{
                        color: isGold ? '#F5C55A' : colors.primary,
                        fontFamily: Typography.fontFamily.bold,
                        fontSize: Typography.fontSize.xs,
                      }}
                    >
                      {plan.badge}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={{ gap: Spacing.xs }}>
                <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'] }}>
                  {plan.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: 38, lineHeight: 44 }}>
                    {plan.price}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, paddingBottom: 7 }}>
                    {plan.label}
                  </Text>
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 21 }}>
                  {plan.description}
                </Text>
              </View>

              <View style={{ gap: Spacing.sm }}>
                {plan.inclusions.map((item) => (
                  <View key={item} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <MaterialCommunityIcons name="check-circle-outline" size={18} color={isGold ? '#F5C55A' : colors.success} />
                    <Text style={{ flex: 1, color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 20 }}>
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
                fullWidth
                disabled={isCurrent}
              />
            </Card>
          );
        })}
      </View>

      <Card style={{ gap: Spacing.md }} borderRadius="lg">
        <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md, alignItems: isWide ? 'center' : 'stretch', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg }}>
              Billing controls
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 20 }}>
              Existing subscribers can manage invoices and payment details here once the billing portal is available.
            </Text>
          </View>
          <Button
            title="Manage billing"
            onPress={handlePortalPress}
            variant="outline"
            icon="credit-card-outline"
            loading={portalLoading}
            disabled={!billingStatus || billingStatus.status === 'none' || billingStatus.status === 'canceled'}
          />
        </View>
      </Card>
    </ScrollView>
  );
}
