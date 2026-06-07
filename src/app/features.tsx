import React from 'react';
import { Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { HOME_FAQS, PUBLIC_FEATURES } from '@/content/publicSite';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const EXTRA_FEATURE = {
  href: '/financial-first-aid' as const,
  title: 'Financial First Aid',
  description:
    'A calmer way to respond to stressful money moments by protecting essentials, reducing confusion, and planning the next step.',
  icon: 'lifebuoy',
};

export default function FeaturesScreen() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title="MoneyKai Features | Expense tracking, budgeting, shared expenses, savings, analytics, and backups"
        description="Explore MoneyKai features for expense tracking, budgeting, groups, savings, analytics, backup and restore, and financial first-aid support."
        path="/features"
        keywords={['budget management app', 'expense tracking app', 'shared expense app', 'personal finance features']}
      />
      <PublicShell
        eyebrow="Feature overview"
        title="Every major feature has a clear job in the MoneyKai public website."
        description="This section explains what each part of MoneyKai helps users do, why it matters, and where to go next for more detail."
      >
        <View style={{ gap: Spacing.xl }}>
          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Core product features
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
              {PUBLIC_FEATURES.map((feature) => (
                <Link key={feature.slug} href={`/features/${feature.slug}` as const} asChild>
                  <TouchableOpacity activeOpacity={0.82} style={{ flexBasis: 280, flexGrow: 1 }}>
                    <SectionCard>
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 16,
                          backgroundColor: colors.primaryBg,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: Spacing.md,
                        }}
                      >
                        <MaterialCommunityIcons name="check-circle-outline" size={22} color={colors.primary} />
                      </View>
                      <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        {feature.title}
                      </Text>
                      <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                        {feature.description}
                      </Text>
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          marginTop: Spacing.md,
                          paddingHorizontal: Spacing.md,
                          paddingVertical: 10,
                          borderRadius: BorderRadius.full,
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: colors.borderLight,
                        }}
                      >
                        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                          Learn more
                        </Text>
                      </View>
                    </SectionCard>
                  </TouchableOpacity>
                </Link>
              ))}

              <Link href={EXTRA_FEATURE.href} asChild>
                <TouchableOpacity activeOpacity={0.82} style={{ flexBasis: 280, flexGrow: 1 }}>
                  <SectionCard>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        backgroundColor: colors.primaryBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: Spacing.md,
                      }}
                    >
                      <MaterialCommunityIcons name={EXTRA_FEATURE.icon as any} size={22} color={colors.primary} />
                    </View>
                    <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      {EXTRA_FEATURE.title}
                    </Text>
                    <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                      {EXTRA_FEATURE.description}
                    </Text>
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        marginTop: Spacing.md,
                        paddingHorizontal: Spacing.md,
                        paddingVertical: 10,
                        borderRadius: BorderRadius.full,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.borderLight,
                      }}
                    >
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        Learn more
                      </Text>
                    </View>
                  </SectionCard>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Trust and continuity matter too
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
              MoneyKai’s public website does more than list features. It explains security expectations, privacy handling, backup continuity, and how the product frames financial first aid.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg }}>
              {[
                { href: '/security' as const, label: 'Open security' },
                { href: '/privacy-policy' as const, label: 'Read privacy policy' },
                { href: '/faq' as const, label: 'Browse FAQ' },
                { href: '/contact' as const, label: 'Contact MoneyKai' },
              ].map((item) => (
                <Link key={item.href} href={item.href} asChild>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={{
                      paddingHorizontal: Spacing.md,
                      paddingVertical: 12,
                      borderRadius: BorderRadius.full,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </SectionCard>

          <View style={{ gap: Spacing.md }}>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Common questions before signup
            </Text>
            <View style={{ gap: Spacing.md }}>
              {HOME_FAQS.slice(0, 4).map((faq) => (
                <SectionCard key={faq.question}>
                  <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {faq.question}
                  </Text>
                  <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                    {faq.answer}
                  </Text>
                </SectionCard>
              ))}
            </View>
          </View>
        </View>
      </PublicShell>
    </>
  );
}
