import React from 'react';
import { Redirect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { SITE } from '@/constants/site';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const HERO_NODES = [
  { label: 'Spending', value: 'Rs 42.8k', icon: 'chart-donut', side: 'left', top: '25%' },
  { label: 'Savings', value: '18.6%', icon: 'piggy-bank-outline', side: 'left', top: '64%' },
  { label: 'Income', value: 'Rs 1.2L', icon: 'cash-plus', side: 'right', top: '28%' },
  { label: 'Portfolio', value: '+9.4%', icon: 'chart-timeline-variant', side: 'right', top: '62%' },
] as const;

const TRUST_POINTS = [
  'Manual Imports',
  'User-Controlled Data',
  'AI Reports',
  'Portfolio Analysis',
  'Statement Insights',
  'Privacy First',
];

const FEATURE_SECTIONS = [
  {
    title: 'Manual Data In, Smart Reports Out',
    description:
      'Upload statements, paste records, or add transactions manually. MoneyKai organizes the data, categorizes it, and builds reports you can review before acting.',
    icon: 'database-import-outline' as IconName,
    stat: '6 input paths',
  },
  {
    title: 'Bank Statement Analysis',
    description:
      'PDF, CSV, Excel, and document statement imports become categorized spending, income, merchant, and cashflow reports after user review.',
    icon: 'file-chart-outline' as IconName,
    stat: 'PDF + Excel',
  },
  {
    title: 'Paste SMS Records Manually',
    description:
      'Paste transaction messages yourself when you want them analyzed. MoneyKai does not read SMS automatically or collect background phone data.',
    icon: 'message-text-outline' as IconName,
    stat: 'Manual paste',
  },
  {
    title: 'Portfolio and Investment Analysis',
    description:
      'Add holdings, buy prices, quantities, platforms, and notes to see allocation, exposure, and risk reports beside daily money behavior.',
    icon: 'briefcase-variant-outline' as IconName,
    stat: 'Risk view',
  },
  {
    title: 'AI Financial Intelligence',
    description:
      'The more user-provided statements, records, and portfolio entries MoneyKai has, the better it can explain habits, risks, and next steps.',
    icon: 'creation-outline' as IconName,
    stat: 'Profile depth',
  },
  {
    title: 'Monthly Reports and Recommendations',
    description:
      'Generate plain-English monthly summaries, what-changed-this-month notes, budget suggestions, unusual transaction flags, and saving opportunities.',
    icon: 'calendar-text-outline' as IconName,
    stat: 'Monthly AI',
  },
];

const REPORT_TYPES = [
  'Spending report',
  'Income report',
  'Savings rate',
  'Cashflow',
  'Category breakdown',
  'Recurring bills',
  'Subscriptions',
  'Portfolio exposure',
  'Unusual transactions',
  'Monthly AI summary',
];

const INSIGHT_CARDS = [
  { label: 'Cashflow clarity', value: 'Rs 18.2k', detail: 'Projected free cash after recurring bills' },
  { label: 'Category drift', value: '+12%', detail: 'Dining moved above its normal range' },
  { label: 'Portfolio exposure', value: '42%', detail: 'Largest allocation needs a closer review' },
];

export default function LandingScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isWide = width >= 980;
  const isCompact = width < 680;

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <>
      <SeoHead
        title="MoneyKai Web | AI Financial Report Engine"
        description="Upload statements, paste transaction records, add portfolios, and let MoneyKai turn user-provided financial data into reports, insights, and smarter decisions."
        path="/"
        keywords={[
          'AI financial report engine',
          'bank statement analysis',
          'manual finance import',
          'portfolio report',
          'MoneyKai web',
        ]}
      />
      <PublicShell>
        <View style={{ gap: Spacing['4xl'] }}>
          <HeroStage isWide={isWide} isCompact={isCompact} />
          <TrustStrip isCompact={isCompact} />

          <View style={{ gap: Spacing.xl }}>
            <SectionTitle
              eyebrow="REPORT-DOMINANT MONEYKAI WEB"
              title="Manual data becomes financial intelligence"
              description="MoneyKai Web is the analytical version of MoneyKai: a premium workspace for importing user-controlled data, reviewing it, and generating AI-powered reports."
              isWide={isWide}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
              {FEATURE_SECTIONS.map((feature) => (
                <FeatureTile key={feature.title} feature={feature} isWide={isWide} />
              ))}
            </View>
          </View>

          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
            <SectionCard style={{ flex: 1.05, overflow: 'hidden', backgroundColor: 'rgba(9, 13, 12, 0.86)' }}>
              <AfterglowOrb style={{ top: -140, right: -120, width: 280, height: 280, opacity: 0.18 }} />
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.accent }}>
                IMPORT CENTER
              </Text>
              <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize['3xl'], lineHeight: 36, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                The user chooses every source
              </Text>
              <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.sm, lineHeight: 23, color: colors.textSecondary }}>
                Upload a bank statement, add an Excel sheet, paste SMS-style transaction messages, enter a transfer, record an investment, or add a subscription manually. MoneyKai can categorize and summarize after the user provides the data.
              </Text>
              <View style={{ gap: Spacing.sm, marginTop: Spacing.lg }}>
                {[
                  ['PDF / Word / Excel statements', 'Preview extracted rows before saving'],
                  ['Manual SMS paste box', 'Paste only the messages you want analyzed'],
                  ['Manual portfolio records', 'Holdings, prices, platform, notes, exposure'],
                  ['Editable review step', 'Approve categories and delete uploads anytime'],
                ].map(([title, detail]) => (
                  <View key={title} style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 7, backgroundColor: colors.primary }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        {title}
                      </Text>
                      <Text style={{ marginTop: 3, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textTertiary }}>
                        {detail}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </SectionCard>

            <SectionCard style={{ flex: 0.95, overflow: 'hidden', backgroundColor: 'rgba(9, 13, 12, 0.86)' }}>
              <AfterglowOrb style={{ bottom: -120, left: -120, width: 260, height: 260, opacity: 0.16 }} />
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.accent }}>
                AI REPORT OUTPUTS
              </Text>
              <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize['3xl'], lineHeight: 36, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                Reports first, raw rows second
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg }}>
                {REPORT_TYPES.map((item) => (
                  <View
                    key={item}
                    style={{
                      paddingHorizontal: Spacing.md,
                      paddingVertical: 10,
                      borderRadius: BorderRadius.full,
                      backgroundColor: 'rgba(255, 255, 255, 0.055)',
                      borderWidth: 1,
                      borderColor: 'rgba(234, 246, 240, 0.11)',
                    }}
                  >
                    <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{item}</Text>
                  </View>
                ))}
              </View>
              <View style={{ gap: Spacing.sm, marginTop: Spacing.lg }}>
                {INSIGHT_CARDS.map((item) => (
                  <View
                    key={item.label}
                    style={{
                      padding: Spacing.md,
                      borderRadius: BorderRadius.lg,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderWidth: 1,
                      borderColor: 'rgba(234, 246, 240, 0.1)',
                    }}
                  >
                    <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>{item.label}</Text>
                    <Text style={{ marginTop: 3, fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                      {item.value}
                    </Text>
                    <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                      {item.detail}
                    </Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          </View>

          <SectionCard style={{ overflow: 'hidden', backgroundColor: 'rgba(7, 10, 9, 0.92)' }}>
            <AfterglowOrb style={{ top: -120, left: '18%', width: 300, height: 300, opacity: 0.13 }} />
            <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.xl, alignItems: isWide ? 'center' : 'stretch' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.accent }}>
                  PRIVACY BY PRODUCT DESIGN
                </Text>
                <Text style={{ marginTop: Spacing.md, fontSize: isWide ? 38 : 30, lineHeight: isWide ? 44 : 36, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                  MoneyKai analyzes only what you provide
                </Text>
                <Text style={{ marginTop: Spacing.md, fontSize: Typography.fontSize.md, lineHeight: 26, color: colors.textSecondary }}>
                  MoneyKai Web does not automatically read SMS, does not automatically capture transactions, and does not collect background phone data. The AI report engine works from uploads, pasted records, imports, portfolios, and entries the user chooses to add.
                </Text>
              </View>
              <View style={{ flex: 1, gap: Spacing.sm }}>
                {[
                  ['No automatic SMS reading', 'Paste transaction messages manually only when you want them analyzed.'],
                  ['No hidden transaction capture', 'Import and review financial records before they become reports.'],
                  ['User-visible data usage', 'Reports should make it clear which uploaded or entered data shaped the insight.'],
                ].map(([title, detail]) => (
                  <View
                    key={title}
                    style={{
                      padding: Spacing.md,
                      borderRadius: BorderRadius.lg,
                      backgroundColor: 'rgba(255, 255, 255, 0.055)',
                      borderWidth: 1,
                      borderColor: 'rgba(234, 246, 240, 0.11)',
                    }}
                  >
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      {title}
                    </Text>
                    <Text style={{ marginTop: 5, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                      {detail}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </SectionCard>

          <View style={{ alignItems: 'center', gap: Spacing.md, paddingBottom: Spacing.xl }}>
            <Text style={{ textAlign: 'center', maxWidth: 780, fontSize: isWide ? 34 : 28, lineHeight: isWide ? 40 : 34, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Build your financial profile from the records you trust MoneyKai with.
            </Text>
            <Text style={{ textAlign: 'center', maxWidth: 660, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
              Start with a statement, paste a few transaction records, add portfolio data, and let the reports become sharper as your manual history grows.
            </Text>
            <View style={{ flexDirection: isCompact ? 'column' : 'row', gap: Spacing.sm, width: isCompact ? '100%' : undefined }}>
              <Button
                title="Open MoneyKai"
                onPress={() => router.push('/(auth)/signup')}
                size="lg"
                icon="arrow-right"
                iconPosition="right"
                fullWidth={isCompact}
              />
              <Button
                title="Explore Reports"
                onPress={() => router.push('/features/analytics')}
                size="lg"
                variant="outline"
                icon="chart-box-outline"
                fullWidth={isCompact}
              />
            </View>
          </View>
        </View>
      </PublicShell>
    </>
  );
}

function HeroStage({ isWide, isCompact }: { isWide: boolean; isCompact: boolean }) {
  const { colors } = useTheme();
  const stageHeight = isWide ? 720 : isCompact ? 820 : 760;

  return (
    <View
      style={{
        minHeight: stageHeight,
        borderRadius: isCompact ? 30 : 42,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(234, 246, 240, 0.12)',
        backgroundColor: '#020303',
        ...Shadows.xl,
        shadowColor: '#000000',
      }}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.02)', 'rgba(173,205,188,0.2)', 'rgba(2,3,3,0.86)']}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 1, y: 0.82 }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />
      <AfterglowOrb style={{ top: -160, right: -90, width: 520, height: 520, opacity: 0.32 }} />
      <AfterglowOrb style={{ bottom: -160, left: -160, width: 420, height: 420, opacity: 0.24 }} />
      <ParticleField />
      <ConnectorLines />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: '48%',
          left: isCompact ? '18%' : '44%',
          width: 220,
          height: 360,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: 'rgba(234, 246, 240, 0.09)',
          opacity: 0.86,
        }}
      />
      <VerticalSignals isCompact={isCompact} />

      {HERO_NODES.map((node) => (
        <MetricNode key={node.label} node={node} isCompact={isCompact} />
      ))}

      <View
        style={{
          position: 'absolute',
          top: isCompact ? 74 : 100,
          alignSelf: 'center',
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
        }}
      >
        <MaterialCommunityIcons name="play" size={20} color={colors.textPrimary} />
      </View>

      <View
        style={{
          position: 'absolute',
          top: isCompact ? 160 : 210,
          alignSelf: 'center',
          paddingHorizontal: Spacing.md,
          paddingVertical: 9,
          borderRadius: BorderRadius.full,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          borderColor: 'rgba(234, 246, 240, 0.12)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <MaterialCommunityIcons name="creation-outline" size={14} color={colors.primary} />
        <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
          Unlock Your Financial Clarity
        </Text>
        <MaterialCommunityIcons name="arrow-right" size={14} color={colors.textSecondary} />
      </View>

      <View
        style={{
          position: 'absolute',
          top: isCompact ? 220 : 286,
          left: isCompact ? Spacing.lg : '17%',
          right: isCompact ? Spacing.lg : '17%',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            textAlign: 'center',
            fontSize: isWide ? 58 : isCompact ? 42 : 50,
            lineHeight: isWide ? 66 : isCompact ? 48 : 56,
            fontFamily: Typography.fontFamily.display,
            color: colors.textPrimary,
          }}
        >
          Your AI Financial Report Engine
        </Text>
        <Text
          style={{
            marginTop: Spacing.md,
            maxWidth: 760,
            textAlign: 'center',
            fontSize: isCompact ? Typography.fontSize.sm : Typography.fontSize.md,
            lineHeight: isCompact ? 22 : 26,
            color: colors.textSecondary,
          }}
        >
          Upload statements, paste transaction records, add portfolios, and let MoneyKai turn your financial data into reports, insights, and smarter decisions.
        </Text>
        <View style={{ flexDirection: isCompact ? 'column' : 'row', gap: Spacing.sm, marginTop: Spacing.xl, width: isCompact ? '100%' : undefined }}>
          <Button
            title="Open MoneyKai"
            onPress={() => router.push('/(auth)/signup')}
            size="lg"
            icon="arrow-top-right"
            iconPosition="right"
            fullWidth={isCompact}
          />
          <Button
            title="Discover Insights"
            onPress={() => router.push('/features/analytics')}
            size="lg"
            variant="outline"
            icon="chart-line"
            fullWidth={isCompact}
          />
        </View>
      </View>

      <View
        style={{
          position: 'absolute',
          right: isCompact ? Spacing.lg : 72,
          bottom: isCompact ? 82 : 74,
          width: isCompact ? 190 : 220,
        }}
      >
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
          Financial horizons
        </Text>
        <View style={{ flexDirection: 'row', gap: 7, marginTop: Spacing.sm }}>
          {[0, 1, 2, 3, 4].map((item) => (
            <View
              key={item}
              style={{
                flex: 1,
                height: item === 0 ? 5 : 4,
                borderRadius: 99,
                backgroundColor: item === 0 ? colors.primary : 'rgba(255, 255, 255, 0.08)',
              }}
            />
          ))}
        </View>
      </View>

      <View
        style={{
          position: 'absolute',
          left: isCompact ? Spacing.lg : 70,
          bottom: isCompact ? 38 : 54,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
          paddingHorizontal: Spacing.md,
          paddingVertical: 10,
          borderRadius: BorderRadius.full,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
          <MaterialCommunityIcons name="arrow-down" size={16} color={colors.textInverse} />
        </View>
        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>01/06 . Scroll down</Text>
      </View>
    </View>
  );
}

function TrustStrip({ isCompact }: { isCompact: boolean }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: isCompact ? Spacing.sm : Spacing.lg,
        justifyContent: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius['2xl'],
        backgroundColor: 'rgba(0, 0, 0, 0.32)',
        borderWidth: 1,
        borderColor: 'rgba(234, 246, 240, 0.08)',
      }}
    >
      {TRUST_POINTS.map((point) => (
        <View key={point} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.9 }}>
          <MaterialCommunityIcons name="star-four-points-outline" size={15} color={colors.textTertiary} />
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
            {point}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  isWide,
}: {
  eyebrow: string;
  title: string;
  description: string;
  isWide: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: isWide ? 'center' : 'flex-start', gap: Spacing.sm }}>
      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.accent }}>
        {eyebrow}
      </Text>
      <Text
        style={{
          maxWidth: 780,
          textAlign: isWide ? 'center' : 'left',
          fontSize: isWide ? 42 : 32,
          lineHeight: isWide ? 48 : 38,
          fontFamily: Typography.fontFamily.display,
          color: colors.textPrimary,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          maxWidth: 720,
          textAlign: isWide ? 'center' : 'left',
          fontSize: Typography.fontSize.md,
          lineHeight: 26,
          color: colors.textSecondary,
        }}
      >
        {description}
      </Text>
    </View>
  );
}

function FeatureTile({
  feature,
  isWide,
}: {
  feature: (typeof FEATURE_SECTIONS)[number];
  isWide: boolean;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={({ hovered, pressed }: any) => ({
        flexBasis: isWide ? 350 : 280,
        flexGrow: 1,
        minHeight: 250,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        backgroundColor: hovered ? 'rgba(18, 27, 23, 0.94)' : 'rgba(10, 14, 13, 0.88)',
        borderWidth: 1,
        borderColor: hovered ? 'rgba(234, 246, 240, 0.22)' : 'rgba(234, 246, 240, 0.1)',
        transform: hovered && !pressed ? [{ translateY: -3 }] : [{ translateY: 0 }],
        ...Shadows.md,
        shadowColor: '#000000',
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(234, 246, 240, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(234, 246, 240, 0.14)',
          }}
        >
          <MaterialCommunityIcons name={feature.icon} size={22} color={colors.primary} />
        </View>
        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>{feature.stat}</Text>
      </View>
      <Text style={{ marginTop: Spacing.lg, fontSize: Typography.fontSize.xl, lineHeight: 28, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
        {feature.title}
      </Text>
      <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
        {feature.description}
      </Text>
    </Pressable>
  );
}

function MetricNode({
  node,
  isCompact,
}: {
  node: (typeof HERO_NODES)[number];
  isCompact: boolean;
}) {
  const { colors } = useTheme();
  const sideStyle = node.side === 'left'
    ? { left: isCompact ? 20 : 72 }
    : { right: isCompact ? 20 : 72 };

  return (
    <View
      style={{
        position: 'absolute',
        top: node.top,
        width: isCompact ? 150 : 210,
        ...sideStyle,
      }}
    >
      <View style={{ height: 1, width: '100%', backgroundColor: 'rgba(234, 246, 240, 0.12)' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md, justifyContent: node.side === 'left' ? 'flex-start' : 'flex-end' }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            borderWidth: 1,
            borderColor: 'rgba(234, 246, 240, 0.14)',
          }}
        >
          <MaterialCommunityIcons name={node.icon} size={18} color={colors.primary} />
        </View>
        <View style={{ alignItems: node.side === 'left' ? 'flex-start' : 'flex-end' }}>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
            {node.label}
          </Text>
          <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>{node.value}</Text>
        </View>
      </View>
    </View>
  );
}

function VerticalSignals({ isCompact }: { isCompact: boolean }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 28,
        left: isCompact ? '30%' : '45%',
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: isCompact ? 18 : 28,
        height: 270,
      }}
    >
      {[140, 205, 170, 245].map((height, index) => (
        <View key={height} style={{ width: 2, height, borderRadius: 2, backgroundColor: index % 2 === 0 ? 'rgba(234, 246, 240, 0.7)' : 'rgba(234, 246, 240, 0.32)' }} />
      ))}
    </View>
  );
}

function ConnectorLines() {
  return (
    <>
      <View style={{ position: 'absolute', top: '23%', left: 0, width: '31%', height: 1, backgroundColor: 'rgba(234,246,240,0.11)' }} />
      <View style={{ position: 'absolute', top: '65%', left: 0, width: '33%', height: 1, backgroundColor: 'rgba(234,246,240,0.11)' }} />
      <View style={{ position: 'absolute', top: '25%', right: 0, width: '30%', height: 1, backgroundColor: 'rgba(234,246,240,0.11)' }} />
      <View style={{ position: 'absolute', top: '63%', right: 0, width: '32%', height: 1, backgroundColor: 'rgba(234,246,240,0.11)' }} />
    </>
  );
}

function ParticleField() {
  const dots = Array.from({ length: 28 }, (_, index) => ({
    left: `${(index * 29) % 92}%`,
    top: `${18 + ((index * 17) % 70)}%`,
    opacity: 0.1 + ((index % 5) * 0.04),
  }));

  return (
    <>
      {dots.map((dot, index) => (
        <View
          key={`${dot.left}-${dot.top}-${index}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: dot.left,
            top: dot.top,
            width: 2,
            height: 2,
            borderRadius: 1,
            backgroundColor: `rgba(234, 246, 240, ${dot.opacity})`,
          }}
        />
      ))}
    </>
  );
}

function AfterglowOrb({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          borderRadius: 999,
          backgroundColor: 'rgba(226, 243, 234, 0.5)',
        },
        style,
      ]}
    />
  );
}
