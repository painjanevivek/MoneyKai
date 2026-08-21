import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import type { SecurityGuide } from '@/content/securityGuides';
import { SITE } from '@/constants/site';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function SecurityGuideTemplate({ guide }: { guide: SecurityGuide }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 920;
  const path = `/security/${guide.slug}`;

  return (
    <>
      <SeoHead
        title={`${guide.label} | MoneyKai Security`}
        description={guide.description}
        path={path}
        keywords={['MoneyKai security', guide.label, 'personal finance privacy']}
      />
      <PublicShell eyebrow="Security guide" title={guide.title} description={guide.summary}>
        <View style={{ gap: Spacing.xl }}>
          {guide.sections.map((section, index) => (
            <SectionCard key={section.title}>
              <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.lg }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: BorderRadius.md,
                    backgroundColor: colors.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name={index === 0 ? guide.icon : 'shield-check-outline'} size={23} color={colors.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {section.title}
                  </Text>
                  <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                    {section.body}
                  </Text>
                  <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
                    {section.points.map((point) => (
                      <View key={point} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                        <MaterialCommunityIcons name="check-circle-outline" size={17} color={colors.primary} style={{ marginTop: 2 }} />
                        <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                          {point}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </SectionCard>
          ))}

          <SectionCard variant="outlined">
            <View style={{ flexDirection: isWide ? 'row' : 'column', alignItems: isWide ? 'center' : 'stretch', gap: Spacing.lg }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Need help with a security or privacy concern?
                </Text>
                <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                  Do not include passwords, verification codes, full card numbers, or sensitive documents in your message.
                </Text>
              </View>
              <Link href="/contact" asChild>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Contact MoneyKai support about security"
                  style={({ hovered, pressed }: any) => ({
                    minHeight: 46,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: Spacing.lg,
                    borderRadius: BorderRadius.md,
                    backgroundColor: hovered ? colors.primaryDark : colors.primary,
                    transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                  })}
                >
                  <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                    Contact support
                  </Text>
                </Pressable>
              </Link>
            </View>
          </SectionCard>

          <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
            For general security and privacy questions, email {SITE.supportEmail}.
          </Text>
        </View>
      </PublicShell>
    </>
  );
}
