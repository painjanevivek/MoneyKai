import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BorderRadius, Shadows, Spacing, Typography, type ColorScheme } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { billingApi, type BillingStatus } from '@/services/billingApi';
import { withAlpha } from '@/utils/glassStyle';

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

const PREMIUM_GOLD = '#F8D774';
const PAID_TEXT_LIGHT = '#FFFFFF';
const PAID_MUTED_LIGHT = 'rgba(255, 255, 255, 0.76)';
const PAID_SUBTLE_LIGHT = 'rgba(255, 255, 255, 0.58)';

const getPlanVisual = (plan: SubscriptionPlan, colors: ColorScheme, isDark: boolean) => {
  const isPaid = plan.key !== 'free';

  if (!isPaid) {
    return {
      surface: colors.glassBg,
      border: colors.glassBorder,
      iconBg: colors.primaryBg,
      iconBorder: colors.glassBorder,
      badgeBg: colors.primaryBg,
      badgeBorder: colors.glassBorder,
      accent: colors.primary,
      check: colors.success,
      title: colors.textPrimary,
      price: colors.textPrimary,
      muted: colors.textSecondary,
      subtle: colors.textTertiary,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.05,
    };
  }

  const isPremium = plan.key === 'premium';
  const accent = isPremium ? (isDark ? colors.primary : PREMIUM_GOLD) : colors.warning;
  const surface = isDark
    ? isPremium
      ? colors.card
      : colors.surfaceElevated
    : isPremium
      ? colors.primary
      : colors.primaryDark;

  return {
    surface,
    border: withAlpha(accent, isDark ? 0.46 : 0.58),
    iconBg: withAlpha(accent, isDark ? 0.16 : 0.18),
    iconBorder: withAlpha(accent, isDark ? 0.34 : 0.44),
    badgeBg: withAlpha(accent, isDark ? 0.14 : 0.16),
    badgeBorder: withAlpha(accent, isDark ? 0.38 : 0.48),
    accent,
    check: accent,
    title: isDark ? colors.textPrimary : PAID_TEXT_LIGHT,
    price: isDark ? colors.textPrimary : PAID_TEXT_LIGHT,
    muted: isDark ? colors.textSecondary : PAID_MUTED_LIGHT,
    subtle: isDark ? colors.textTertiary : PAID_SUBTLE_LIGHT,
    shadowColor: accent,
    shadowOpacity: isDark ? 0.12 : 0.2,
  };
};

export default function SubscriptionsScreen() {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 1080;
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);

  useEffect(() => {
    let mounted = true;

    billingApi
      .getStatus()
      .then((status) => {
        if (mounted) setBillingStatus(status);
      })
      .catch((error) => {
        void error;
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

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xl }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: isWide ? 'row' : 'column', gap: isWide ? Spacing.lg : Spacing.base, alignItems: 'stretch' }}>
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isPaid = plan.key !== 'free';
          const visual = getPlanVisual(plan, colors, isDark);
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
                borderWidth: 1,
                borderColor: visual.border,
                backgroundColor: visual.surface,
                ...Shadows.sm,
                shadowColor: visual.shadowColor,
                shadowOpacity: visual.shadowOpacity,
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
                    backgroundColor: visual.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: visual.iconBorder,
                  }}
                >
                  <MaterialCommunityIcons name={plan.icon} size={23} color={visual.accent} />
                </View>
                {plan.badge ? (
                  <View
                    style={{
                      borderRadius: BorderRadius.full,
                      paddingHorizontal: Spacing.sm,
                      paddingVertical: 6,
                      backgroundColor: visual.badgeBg,
                      borderWidth: 1,
                      borderColor: visual.badgeBorder,
                    }}
                  >
                    <Text
                      style={{
                        color: isPaid ? visual.accent : colors.primary,
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
                <Text style={{ color: visual.title, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'] }}>
                  {plan.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={{ color: visual.price, fontFamily: Typography.fontFamily.display, fontSize: 38, lineHeight: 44 }}>
                    {plan.price}
                  </Text>
                  <Text style={{ color: visual.subtle, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, paddingBottom: 7 }}>
                    {plan.label}
                  </Text>
                </View>
                <Text style={{ color: visual.muted, fontSize: Typography.fontSize.sm, lineHeight: 21 }}>
                  {plan.description}
                </Text>
              </View>

              <View style={{ gap: Spacing.sm }}>
                {plan.inclusions.map((item) => (
                  <View key={item} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <MaterialCommunityIcons name="check-circle-outline" size={18} color={visual.check} />
                    <Text style={{ flex: 1, color: visual.muted, fontSize: Typography.fontSize.sm, lineHeight: 20 }}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

              <Button
                title={isCurrent ? 'Current plan' : plan.key === 'free' ? 'Continue Free' : `Choose ${plan.name}`}
                onPress={() => handlePlanPress(plan)}
                variant={isPaid ? 'primary' : 'outline'}
                tone={isPaid && !isDark ? 'onDark' : 'default'}
                icon={isCurrent ? 'check-circle-outline' : plan.key === 'free' ? 'arrow-left' : 'arrow-right'}
                iconPosition={isCurrent || plan.key === 'free' ? 'left' : 'right'}
                fullWidth
                disabled={isCurrent}
              />
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}
