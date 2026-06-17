import React from 'react';
import { Redirect, router } from 'expo-router';
import { Image, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Asset } from 'expo-asset';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { SITE } from '@/constants/site';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';

const TRUST_POINTS = ['Manual imports', 'Review before save', 'Private reports', 'Portfolio workspace'];
const WORKFLOWS = [
  {
    icon: 'database-import-outline',
    title: 'Import on your terms',
    body: 'Upload statements, paste records, or add transactions manually. MoneyKai keeps review in the loop.',
  },
  {
    icon: 'chart-box-outline',
    title: 'See reports that explain',
    body: 'Turn rows into category movement, cashflow, budget pressure, unusual spend, and monthly summaries.',
  },
  {
    icon: 'briefcase-outline',
    title: 'Connect money to wealth',
    body: 'Track holdings, account placeholders, allocation, and exposure beside everyday spending.',
  },
] as const;

const REPORT_SIGNALS = [
  ['Budget left', 'Rs 18.4k', 'On track'],
  ['Reviewed records', '248', 'This quarter'],
  ['Largest category', 'Food', '+8% vs norm'],
  ['Portfolio exposure', '42%', 'Top allocation'],
] as const;
const HERO_IMAGE = require('../../assets/images/tutorial-web.png');

export default function LandingScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isCompact = width < 720;
  const isWide = width >= 980;
  const heroImageUri = Asset.fromModule(HERO_IMAGE).uri;
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE.name,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web, iOS, Android',
      url: SITE.url,
      description: 'MoneyKai is a private personal finance workspace for reviewed transactions, budgets, statements, reports, shared expenses, savings, and portfolio context.',
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
        title="MoneyKai | Private AI finance reports"
        description="MoneyKai turns user-provided statements, transactions, budgets, and portfolio records into private financial reports."
        path="/"
        keywords={['AI finance reports', 'private finance app', 'budget reports', 'statement import', 'portfolio tracker']}
        preloadImageHref={heroImageUri}
        structuredData={structuredData}
      />
      <PublicShell>
        <View style={{ gap: Spacing['4xl'] }}>
          <Hero isCompact={isCompact} isWide={isWide} />

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
              DIRECT ANSWER
            </Text>
            <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize['2xl'], lineHeight: 34, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              What is MoneyKai?
            </Text>
            <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.md, lineHeight: 26, color: colors.textSecondary }}>
              MoneyKai is a personal finance app for people who want to review their money before acting on it. It helps users add or import records, track expenses, manage budgets, understand monthly patterns, organize shared costs, and connect portfolio context in one private workspace.
            </Text>
          </SectionCard>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
            {WORKFLOWS.map((item) => (
              <SectionCard key={item.title} style={{ flexBasis: 300, flexGrow: 1, minHeight: 210 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: BorderRadius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primaryBg,
                    borderWidth: 1,
                    borderColor: `${colors.primary}22`,
                  }}
                >
                  <MaterialCommunityIcons name={item.icon} size={22} color={colors.primary} />
                </View>
                <Text style={{ marginTop: Spacing.lg, fontSize: Typography.fontSize.xl, lineHeight: 28, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {item.title}
                </Text>
                <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  {item.body}
                </Text>
              </SectionCard>
            ))}
          </View>

          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.xl, alignItems: 'stretch' }}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.accent }}>
                PREMIUM FINTECH WORKFLOW
              </Text>
              <Text style={{ marginTop: Spacing.sm, fontSize: isWide ? 42 : 32, lineHeight: isWide ? 48 : 38, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                Reports first. Raw rows only when you need them.
              </Text>
              <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.md, lineHeight: 26, color: colors.textSecondary }}>
                MoneyKai is designed around reviewed financial decisions: what changed, what is risky, what is available, and which records created the answer.
              </Text>
            </View>
            <View style={{ flex: 1.2, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
              {REPORT_SIGNALS.map(([label, value, detail]) => (
                <SectionCard key={label} style={{ flexBasis: 220, flexGrow: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{label}</Text>
                  <Text style={{ marginTop: 5, fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
                    {value}
                  </Text>
                  <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>{detail}</Text>
                </SectionCard>
              ))}
            </View>
          </View>

          <SectionCard style={{ backgroundColor: colors.primaryDark, borderColor: 'rgba(234,246,240,0.14)' }}>
            <View style={{ flexDirection: isWide ? 'row' : 'column', alignItems: isWide ? 'center' : 'stretch', gap: Spacing.xl }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: 'rgba(255,255,255,0.62)' }}>
                  TRUST BY PRODUCT DESIGN
                </Text>
                <Text style={{ marginTop: Spacing.sm, fontSize: isWide ? 36 : 28, lineHeight: isWide ? 42 : 34, fontFamily: Typography.fontFamily.display, color: '#FFFFFF' }}>
                  MoneyKai analyzes what you choose to provide.
                </Text>
                <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.sm, lineHeight: 23, color: 'rgba(255,255,255,0.74)' }}>
                  No hidden public promise needs to do the work. The product experience shows data sources, review steps, imports, and account controls in context.
                </Text>
              </View>
              <View style={{ flex: 1, gap: Spacing.sm }}>
                {[
                  ['No background SMS reading on web', 'Paste or import records yourself.'],
                  ['Review before insights', 'Imported records stay visible before they shape reports.'],
                  ['Explainable summaries', 'Reports should point back to the records that created them.'],
                ].map(([title, body]) => (
                  <View key={title} style={{ padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' }}>{title}</Text>
                    <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xs, lineHeight: 18, color: 'rgba(255,255,255,0.68)' }}>{body}</Text>
                  </View>
                ))}
              </View>
            </View>
          </SectionCard>
        </View>
      </PublicShell>
    </>
  );
}

function Hero({ isCompact, isWide }: { isCompact: boolean; isWide: boolean }) {
  const { colors } = useTheme();
  const heroHeight = isWide ? 720 : isCompact ? 680 : 700;

  return (
    <View
      style={{
        minHeight: heroHeight,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(234, 246, 240, 0.14)',
        backgroundColor: '#020403',
        ...Shadows.lg,
        shadowColor: '#000000',
      }}
    >
      <Image
        source={HERO_IMAGE}
        resizeMode="cover"
        accessible={false}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%', opacity: 0.36 }}
      />
      <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(2, 4, 3, 0.72)' }} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.22)' }} />

      <View style={{ flex: 1, justifyContent: 'center', padding: isCompact ? Spacing.lg : Spacing['4xl'], maxWidth: 900 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg }}>
          {TRUST_POINTS.map((point) => (
            <View key={point} style={{ paddingHorizontal: Spacing.md, paddingVertical: 9, borderRadius: BorderRadius.full, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: 'rgba(255,255,255,0.78)' }}>{point}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: isWide ? 64 : isCompact ? 40 : 54, lineHeight: isWide ? 70 : isCompact ? 46 : 60, fontFamily: Typography.fontFamily.display, color: '#FFFFFF' }}>
          Private AI finance reports for the money you actually review.
        </Text>
        <Text style={{ marginTop: Spacing.lg, maxWidth: 720, fontSize: isCompact ? Typography.fontSize.sm : Typography.fontSize.md, lineHeight: isCompact ? 22 : 27, color: 'rgba(255,255,255,0.76)' }}>
          Upload statements, paste records, track budgets, and connect portfolio context into one calm MoneyKai workspace.
        </Text>
        <View style={{ flexDirection: isCompact ? 'column' : 'row', gap: Spacing.sm, marginTop: Spacing.xl, width: isCompact ? '100%' : undefined }}>
          <Button title="Create secure account" icon="shield-account-outline" onPress={() => router.push('/(auth)/signup')} size="lg" fullWidth={isCompact} />
          <Button title="View pricing" icon="tag-outline" onPress={() => router.push('/pricing')} size="lg" variant="outline" fullWidth={isCompact} />
        </View>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Read the MoneyKai trust and security model"
          onPress={() => router.push('/security')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.xl }}
        >
          <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.primary} />
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: 'rgba(255,255,255,0.82)' }}>
            Read the trust and security model
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
