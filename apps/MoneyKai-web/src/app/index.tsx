import React from 'react';
import { Redirect, router } from 'expo-router';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PublicShell } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { SITE } from '@/constants/site';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAuthStore } from '@/stores/useAuthStore';

const landingColors = Colors.light;

const PRODUCT_POINTS = [
  {
    icon: 'database-import-outline',
    title: 'Bring records in',
    body: 'Add transactions, statements, and notes without turning the page into a data dump.',
  },
  {
    icon: 'check-decagram-outline',
    title: 'Review first',
    body: 'Keep imported money records visible before they become reports or decisions.',
  },
  {
    icon: 'chart-line-variant',
    title: 'Read the pattern',
    body: 'See calm summaries for budgets, spending, savings, and portfolio context.',
  },
] as const;

const REVIEW_STEPS = ['Import', 'Review', 'Report'] as const;

export default function LandingScreen() {
  const { width } = useWindowDimensions();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isCompact = width < 720;
  const isWide = width >= 980;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE.name,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web, iOS, Android',
      url: SITE.url,
      description: 'MoneyKai is a private personal finance workspace for reviewed records, budgets, reports, savings, and portfolio context.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/favicon.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: SITE.supportEmail,
      },
    },
  ];

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <>
      <SeoHead
        title="MoneyKai | Private finance reports"
        description="MoneyKai is a clean personal finance workspace for reviewed records, budgets, savings, and private reports."
        path="/"
        keywords={['finance reports', 'private finance app', 'budget reports', 'statement import', 'portfolio tracker']}
        structuredData={structuredData}
      />
      <PublicShell tone="light">
        <View style={{ gap: Spacing['3xl'] }}>
          <Hero isCompact={isCompact} isWide={isWide} />
          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
            {PRODUCT_POINTS.map((item) => (
              <View
                key={item.title}
                style={{
                  flex: 1,
                  minHeight: 176,
                  padding: Spacing.lg,
                  borderRadius: BorderRadius.sm,
                  backgroundColor: landingColors.card,
                  borderWidth: 1,
                  borderColor: landingColors.borderLight,
                  ...Shadows.sm,
                  shadowColor: landingColors.shadowColor,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: BorderRadius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: landingColors.primaryBg,
                    borderWidth: 1,
                    borderColor: `${landingColors.primary}1F`,
                  }}
                >
                  <MaterialCommunityIcons name={item.icon} size={20} color={landingColors.primary} />
                </View>
                <Text style={{ marginTop: Spacing.lg, fontSize: Typography.fontSize.lg, lineHeight: 26, fontFamily: Typography.fontFamily.semiBold, color: landingColors.textPrimary }}>
                  {item.title}
                </Text>
                <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, lineHeight: 22, color: landingColors.textSecondary }}>
                  {item.body}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </PublicShell>
    </>
  );
}

function Hero({ isCompact, isWide }: { isCompact: boolean; isWide: boolean }) {
  return (
    <View
      style={{
        minHeight: isWide ? 560 : undefined,
        flexDirection: isWide ? 'row' : 'column',
        alignItems: 'center',
        gap: isWide ? Spacing['4xl'] : Spacing['2xl'],
        paddingTop: isCompact ? Spacing.xl : Spacing['4xl'],
        paddingBottom: isCompact ? Spacing['2xl'] : Spacing['4xl'],
      }}
    >
      <View style={{ flex: 1, maxWidth: 640 }}>
        <View
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: Spacing.md,
            paddingVertical: 8,
            borderRadius: BorderRadius.full,
            backgroundColor: landingColors.surfaceElevated,
            borderWidth: 1,
            borderColor: landingColors.borderLight,
          }}
        >
          <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: landingColors.primary }} />
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: landingColors.textSecondary }}>
            Private by design
          </Text>
        </View>

        <Text
          style={{
            marginTop: Spacing.lg,
            fontSize: isWide ? 68 : isCompact ? 42 : 56,
            lineHeight: isWide ? 74 : isCompact ? 48 : 62,
            fontFamily: Typography.fontFamily.display,
            color: landingColors.textPrimary,
          }}
        >
          MoneyKai
        </Text>
        <Text
          style={{
            marginTop: Spacing.md,
            maxWidth: 590,
            fontSize: isCompact ? Typography.fontSize.lg : Typography.fontSize.xl,
            lineHeight: isCompact ? 28 : 32,
            color: landingColors.textSecondary,
          }}
        >
          A minimal finance workspace for records you review, reports you trust, and money decisions that stay calm.
        </Text>

        <View style={{ flexDirection: isCompact ? 'column' : 'row', gap: Spacing.sm, marginTop: Spacing.xl, width: isCompact ? '100%' : undefined }}>
          <LandingButton title="Create account" icon="shield-account-outline" onPress={() => router.push('/(auth)/signup')} primary fullWidth={isCompact} />
          <LandingButton title="See pricing" icon="tag-outline" onPress={() => router.push('/pricing')} fullWidth={isCompact} />
        </View>
      </View>

      <ProductPreview compact={!isWide} />
    </View>
  );
}

function ProductPreview({ compact }: { compact: boolean }) {
  return (
    <View
      accessibilityLabel="MoneyKai report preview"
      style={{
        width: '100%',
        maxWidth: compact ? 620 : 460,
        padding: Spacing.lg,
        borderRadius: BorderRadius.sm,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: landingColors.borderLight,
        ...Shadows.lg,
        shadowColor: landingColors.shadowColor,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}>
        <View>
          <Text style={{ fontSize: Typography.fontSize.xs, color: landingColors.textTertiary }}>Monthly review</Text>
          <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: landingColors.textPrimary }}>
            Ready for review
          </Text>
        </View>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: BorderRadius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: landingColors.primaryBg,
          }}
        >
          <MaterialCommunityIcons name="chart-box-outline" size={22} color={landingColors.primary} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl }}>
        {REVIEW_STEPS.map((step, index) => (
          <View key={step} style={{ flex: 1, gap: Spacing.sm }}>
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: landingColors.textSecondary }}>{step}</Text>
            <View
              style={{
                height: 8,
                borderRadius: BorderRadius.full,
                backgroundColor: index === 0 ? landingColors.primary : index === 1 ? landingColors.accent : landingColors.borderLight,
              }}
            />
          </View>
        ))}
      </View>

      <View style={{ marginTop: Spacing.xl, gap: Spacing.sm }}>
        {['Budget notes', 'Statement records', 'Portfolio context'].map((label) => (
          <View
            key={label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              paddingVertical: Spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: landingColors.borderLight,
            }}
          >
            <MaterialCommunityIcons name="check-circle-outline" size={18} color={landingColors.primary} />
            <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: landingColors.textSecondary }}>{label}</Text>
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: landingColors.textTertiary }}>Reviewed</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function LandingButton({
  title,
  icon,
  onPress,
  primary = false,
  fullWidth = false,
}: {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  primary?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ hovered, pressed }: any) => ({
        minHeight: 54,
        width: fullWidth ? '100%' : undefined,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.sm,
        backgroundColor: primary ? landingColors.primary : '#FFFFFF',
        borderWidth: 1,
        borderColor: primary ? landingColors.primary : landingColors.borderLight,
        transform: pressed ? [{ scale: 0.98 }] : hovered ? [{ translateY: -1 }] : [{ translateY: 0 }],
        ...Shadows.sm,
        shadowColor: landingColors.shadowColor,
      })}
    >
      <MaterialCommunityIcons name={icon} size={19} color={primary ? '#FFFFFF' : landingColors.primary} />
      <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: primary ? '#FFFFFF' : landingColors.primary }}>
        {title}
      </Text>
    </Pressable>
  );
}
