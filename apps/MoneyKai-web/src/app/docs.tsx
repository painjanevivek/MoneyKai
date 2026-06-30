import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SeoHead } from '@/components/marketing/SeoHead';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { MONEYKAI_DOC_OUTLINE, MONEYKAI_DOC_SECTIONS, type MoneyKaiDocSection } from '@/content/moneykaiDocs';
import { useHydratedViewportWidth } from '@/hooks/useHydratedViewportWidth';

const docsColors = Colors.jetLuxuryLight;

const TOP_NAV = [
  { href: '/docs', label: 'Guides', active: true },
  { href: '/features', label: 'Features', active: false },
  { href: '/learn', label: 'Learn', active: false },
  { href: '/security', label: 'Security', active: false },
  { href: '/faq', label: 'Reference', active: false },
] as const;

const QUICK_START_STEPS = [
  'Confirm the reporting month before reviewing any workspace totals.',
  'Start from Dashboard, then move into the specific section that owns the data you need to correct.',
  'Use local transactions and budgets as the source of truth for summaries.',
  'Treat cloud sync, SMS capture, Gmail sync, bank sync, Financial AI, wealth, and provider account features as out of scope for the current Android release.',
];

const PageLink = ({ href, label, active = false }: { href: string; label: string; active?: boolean }) => (
  <Link href={href as any} asChild>
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open ${label}`}
      accessibilityState={active ? { selected: true } : undefined}
      style={({ hovered, pressed }: any) => ({
        minHeight: 38,
        justifyContent: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        borderRadius: BorderRadius.sm,
        backgroundColor: active ? '#EEF2FF' : hovered ? '#F4F4F2' : 'transparent',
        transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
      })}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: Typography.fontSize.base,
          lineHeight: 22,
          fontFamily: active ? Typography.fontFamily.semiBold : Typography.fontFamily.medium,
          color: active ? '#2454C6' : docsColors.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  </Link>
);

const SidebarLink = ({ section, wide }: { section: MoneyKaiDocSection; wide: boolean }) => (
  <Link href={`/docs#${section.id}` as any} asChild>
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Read ${section.title} docs`}
      style={({ hovered, pressed }: any) => ({
        minHeight: 46,
        width: wide ? '100%' : 150,
        display: 'flex',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 9,
        borderRadius: BorderRadius.sm,
        backgroundColor: hovered ? '#F4F4F2' : 'transparent',
        transform: pressed ? [{ scale: 0.99 }] : [{ scale: 1 }],
      })}
    >
      <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'nowrap' }}>
        <MaterialCommunityIcons name={section.icon} size={21} color="#64645F" style={{ width: 24, flexShrink: 0 }} />
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: Typography.fontSize.base,
            lineHeight: 22,
            fontFamily: Typography.fontFamily.medium,
            color: docsColors.textSecondary,
          }}
        >
          {section.navLabel}
        </Text>
      </View>
    </Pressable>
  </Link>
);

const OutlineLink = ({ id, label }: { id: string; label: string }) => (
  <Link href={`/docs#${id}` as any} asChild>
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Jump to ${label}`}
      style={({ hovered }: any) => ({
        paddingVertical: 7,
        paddingLeft: Spacing.md,
        borderLeftWidth: 2,
        borderLeftColor: hovered ? '#2454C6' : '#E3E3DF',
      })}
    >
      <Text
        style={{
          fontSize: Typography.fontSize.sm,
          lineHeight: 20,
          fontFamily: Typography.fontFamily.medium,
          color: docsColors.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  </Link>
);

const DocsHeader = ({ compact }: { compact: boolean }) => (
  <View
    style={{
      minHeight: 74,
      flexDirection: compact ? 'column' : 'row',
      alignItems: compact ? 'stretch' : 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
      paddingHorizontal: compact ? Spacing.base : Spacing['2xl'],
      paddingVertical: Spacing.md,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E8E8E3',
      ...Shadows.sm,
      shadowColor: docsColors.shadowColor,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Go to MoneyKai home"
        onPress={() => router.push('/')}
        style={({ hovered, pressed }: any) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 4,
          margin: -4,
          borderRadius: BorderRadius.sm,
          backgroundColor: hovered ? '#F4F4F2' : 'transparent',
          transform: pressed ? [{ scale: 0.99 }] : [{ scale: 1 }],
        })}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: BorderRadius.sm,
            borderWidth: 1,
            borderColor: '#E1DFD8',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
          }}
        >
          <Image
            source={{ uri: '/brand/moneykai-mark-96.png' }}
            contentFit="contain"
            accessibilityLabel="MoneyKai logo"
            style={{ width: 30, height: 30 }}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            style={{
              fontSize: compact ? Typography.fontSize.xl : Typography.fontSize['2xl'],
              lineHeight: compact ? 28 : 32,
              fontFamily: Typography.fontFamily.semiBold,
              color: docsColors.textPrimary,
            }}
          >
            MoneyKai
          </Text>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: BorderRadius.sm,
              backgroundColor: '#E7F0FF',
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.base, lineHeight: 20, fontFamily: Typography.fontFamily.semiBold, color: '#183A78' }}>
              Docs
            </Text>
          </View>
        </View>
      </Pressable>
    </View>

    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: compact ? 'space-between' : 'flex-end',
        flexWrap: 'wrap',
        gap: Spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
        {TOP_NAV.map((item) => (
          <PageLink key={item.label} href={item.href} label={item.label} active={item.active} />
        ))}
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Open MoneyKai"
        onPress={() => router.push('/signup')}
        style={({ hovered, pressed }: any) => ({
          minHeight: 46,
          justifyContent: 'center',
          paddingHorizontal: Spacing.lg,
          borderRadius: BorderRadius.full,
          backgroundColor: hovered ? '#1747B5' : '#2454C6',
          transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
        })}
      >
        <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' }}>
          Get started
        </Text>
      </Pressable>
    </View>
  </View>
);

const SectionDoc = ({ section }: { section: MoneyKaiDocSection }) => (
  <View
    nativeID={section.id}
    style={{
      gap: Spacing.md,
      paddingTop: Spacing['2xl'],
      borderTopWidth: 1,
      borderTopColor: '#ECEBE6',
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: BorderRadius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F1F5F9',
          borderWidth: 1,
          borderColor: '#E2E8F0',
        }}
      >
        <MaterialCommunityIcons name={section.icon} size={22} color="#2454C6" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 16, fontFamily: Typography.fontFamily.semiBold, color: '#2454C6' }}>
          {section.eyebrow}
        </Text>
        <Text
          accessibilityRole="header"
          style={{ fontSize: Typography.fontSize['2xl'], lineHeight: 34, fontFamily: Typography.fontFamily.display, color: docsColors.textPrimary }}
        >
          {section.title}
        </Text>
      </View>
    </View>

    <Text style={{ fontSize: Typography.fontSize.md, lineHeight: 28, color: docsColors.textSecondary }}>
      {section.summary}
    </Text>

    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
      {[
        { title: "What you'll achieve", items: section.outcomes, icon: 'information-outline' as const },
        { title: 'Recommended workflow', items: section.workflow, icon: 'format-list-checks' as const },
        { title: 'Production notes', items: section.productionNotes, icon: 'shield-check-outline' as const },
      ].map((block) => (
        <View
          key={`${section.id}-${block.title}`}
          style={{
            flexBasis: 260,
            flexGrow: 1,
            gap: Spacing.sm,
            padding: Spacing.md,
            borderRadius: BorderRadius.sm,
            backgroundColor: '#FAFAF8',
            borderWidth: 1,
            borderColor: '#ECEBE6',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name={block.icon} size={18} color="#2454C6" />
            <Text style={{ fontSize: Typography.fontSize.base, lineHeight: 22, fontFamily: Typography.fontFamily.semiBold, color: docsColors.textPrimary }}>
              {block.title}
            </Text>
          </View>
          <View style={{ gap: 8 }}>
            {block.items.map((item) => (
              <View key={item} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{ fontSize: Typography.fontSize.base, lineHeight: 24, color: docsColors.textSecondary }}>{'\u2022'}</Text>
                <Text style={{ flex: 1, fontSize: Typography.fontSize.base, lineHeight: 24, color: docsColors.textSecondary }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  </View>
);

export default function MoneyKaiDocsScreen() {
  const width = useHydratedViewportWidth();
  const compact = width < 760;
  const wide = width >= 1120;

  return (
    <>
      <SeoHead
        title="MoneyKai Docs | Product guide for every workspace section"
        description="MoneyKai Docs explains the current local Android release: Dashboard, Transactions, Budgets, Goals, Reports, and encrypted backup boundaries."
        path="/docs"
        keywords={['MoneyKai Docs', 'MoneyKai documentation', 'MoneyKai dashboard guide', 'MoneyKai app sections']}
        structuredData={{
          '@type': 'TechArticle',
          headline: 'MoneyKai Docs',
          description:
            'Documentation for MoneyKai workspace sections in the current local Android release, including Dashboard, Transactions, Budgets, Goals, Reports, and encrypted backup boundaries.',
          author: {
            '@type': 'Organization',
            name: 'MoneyKai',
          },
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <DocsHeader compact={compact} />

          <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', minHeight: 0 }}>
            <View
              style={{
                width: wide ? 280 : '100%',
                borderRightWidth: wide ? 1 : 0,
                borderBottomWidth: wide ? 0 : 1,
                borderColor: '#E8E8E3',
                backgroundColor: '#FFFFFF',
              }}
            >
              <ScrollView
                horizontal={!wide}
                showsHorizontalScrollIndicator={!wide}
                showsVerticalScrollIndicator={wide}
                contentContainerStyle={{
                  gap: wide ? 2 : Spacing.xs,
                  paddingHorizontal: compact ? Spacing.base : Spacing.lg,
                  paddingVertical: Spacing.md,
                }}
              >
                {wide ? (
                  <View style={{ gap: Spacing.xs, paddingBottom: Spacing.sm }}>
                    <Text style={{ fontSize: Typography.fontSize.lg, lineHeight: 26, fontFamily: Typography.fontFamily.semiBold, color: docsColors.textPrimary }}>
                      Get started
                    </Text>
                    <PageLink href="/docs#quick-start" label="Quick start" active />
                    <PageLink href="/docs#what-you-get" label="What you'll understand" />
                    <View style={{ height: 1, backgroundColor: '#E8E8E3', marginVertical: Spacing.sm }} />
                    <Text style={{ fontSize: Typography.fontSize.lg, lineHeight: 26, fontFamily: Typography.fontFamily.semiBold, color: docsColors.textPrimary }}>
                      Workspace sections
                    </Text>
                  </View>
                ) : null}
                <View style={{ flexDirection: wide ? 'column' : 'row', gap: wide ? 2 : Spacing.xs }}>
                  {MONEYKAI_DOC_SECTIONS.map((section) => (
                    <SidebarLink key={section.id} section={section} wide={wide} />
                  ))}
                </View>
              </ScrollView>
            </View>

            <ScrollView
              style={{ flex: 1, minWidth: 0 }}
              showsVerticalScrollIndicator
              contentContainerStyle={{
                paddingHorizontal: compact ? Spacing.base : Spacing['3xl'],
                paddingTop: compact ? Spacing.lg : Spacing['2xl'],
                paddingBottom: Spacing['5xl'],
              }}
            >
              <View style={{ width: '100%', maxWidth: 980, alignSelf: 'center', flexDirection: wide ? 'row' : 'column', gap: Spacing['3xl'] }}>
                <View style={{ flex: 1, minWidth: 0, gap: Spacing['2xl'] }}>
                  <View
                    nativeID="quick-start"
                    style={{
                      gap: Spacing.md,
                      padding: compact ? Spacing.lg : Spacing['2xl'],
                      borderRadius: BorderRadius.md,
                      backgroundColor: '#EEF1F5',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Link href={'/docs' as any} asChild>
                        <Pressable accessibilityRole="link" accessibilityLabel="Open MoneyKai Docs">
                          <Text style={{ fontSize: Typography.fontSize.base, lineHeight: 22, fontFamily: Typography.fontFamily.medium, color: '#2454C6' }}>
                            Docs
                          </Text>
                        </Pressable>
                      </Link>
                      <MaterialCommunityIcons name="chevron-right" size={18} color={docsColors.textTertiary} />
                      <Text style={{ fontSize: Typography.fontSize.base, lineHeight: 22, color: docsColors.textSecondary }}>
                        Quick start
                      </Text>
                    </View>
                    <Text
                      accessibilityRole="header"
                      style={{
                        fontSize: compact ? Typography.fontSize['3xl'] : 48,
                        lineHeight: compact ? 38 : 56,
                        fontFamily: Typography.fontFamily.display,
                        color: docsColors.textPrimary,
                      }}
                    >
                      Set up and navigate MoneyKai
                    </Text>
                    <Text style={{ maxWidth: 850, fontSize: Typography.fontSize.md, lineHeight: 28, color: docsColors.textSecondary }}>
                      MoneyKai Docs is a practical map for the web workspace. Use it to understand what each section owns,
                      where to make changes, and which production constraints matter before shipping or relying on data.
                    </Text>
                  </View>

                  <View nativeID="what-you-get" style={{ gap: Spacing.md }}>
                    <Text
                      accessibilityRole="header"
                      style={{ fontSize: Typography.fontSize['2xl'], lineHeight: 34, fontFamily: Typography.fontFamily.display, color: docsColors.textPrimary }}
                    >
                      What you will understand
                    </Text>
                    <View
                      style={{
                        gap: Spacing.sm,
                        padding: Spacing.lg,
                        borderLeftWidth: 4,
                        borderLeftColor: '#2454C6',
                        backgroundColor: '#F7F8FA',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialCommunityIcons name="information-outline" size={22} color="#2454C6" />
                        <Text style={{ fontSize: Typography.fontSize.lg, lineHeight: 28, fontFamily: Typography.fontFamily.semiBold, color: '#2454C6' }}>
                          Page outcomes
                        </Text>
                      </View>
                      {QUICK_START_STEPS.map((step) => (
                        <View key={step} style={{ flexDirection: 'row', gap: 8 }}>
                          <Text style={{ fontSize: Typography.fontSize.base, lineHeight: 25, color: docsColors.textSecondary }}>{'\u2022'}</Text>
                          <Text style={{ flex: 1, fontSize: Typography.fontSize.base, lineHeight: 25, color: docsColors.textSecondary }}>
                            {step}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {MONEYKAI_DOC_SECTIONS.map((section) => (
                    <SectionDoc key={section.id} section={section} />
                  ))}
                </View>

                {wide ? (
                  <View style={{ width: 260, paddingTop: 2 }}>
                    <View style={{ gap: Spacing.xs }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: Spacing.xs }}>
                        <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#2454C6" />
                        <Text style={{ fontSize: Typography.fontSize.base, lineHeight: 22, fontFamily: Typography.fontFamily.semiBold, color: docsColors.textPrimary }}>
                          On this page
                        </Text>
                      </View>
                      {MONEYKAI_DOC_OUTLINE.map((item) => (
                        <OutlineLink key={item.id} id={item.id} label={item.label} />
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
