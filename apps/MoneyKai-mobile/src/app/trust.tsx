import React from 'react';
import { Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const TRUST_PILLARS = [
  {
    title: 'Private by default mindset',
    body: 'MoneyKai explains clearly what data is used for and keeps privacy expectations visible instead of hidden behind product copy.',
    icon: 'shield-account-outline',
  },
  {
    title: 'Backup continuity',
    body: 'Backup and restore support exists because personal finance data is only useful if you can keep it available over time.',
    icon: 'cloud-check-outline',
  },
  {
    title: 'Financial first aid',
    body: 'The former SOS framing becomes a calmer, more practical layer for handling money stress, disruption, and urgent decisions.',
    icon: 'lifebuoy',
  },
];

export default function TrustScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  return (
    <>
      <SeoHead
        title="Why MoneyKai can be trusted | Privacy, backups, security, and financial first aid"
        description="MoneyKai’s trust layer covers privacy, backup continuity, security expectations, and a calmer financial first-aid approach for stressful money moments."
        path="/trust"
        keywords={['finance app trust', 'budget app privacy', 'financial first aid', 'backup restore app']}
      />
      <PublicShell
        eyebrow="Trust layer"
        title="A money app should explain why it deserves a place in someone’s life."
        description="Trust is not one page. It is the combination of clear product behavior, visible privacy expectations, continuity planning, and language that respects the user."
      >
        <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
          {TRUST_PILLARS.map((pillar) => (
            <SectionCard key={pillar.title} style={{ flex: 1 }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  backgroundColor: colors.primaryBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: Spacing.md,
                }}
              >
                <MaterialCommunityIcons name={pillar.icon as any} size={24} color={colors.primary} />
              </View>
              <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                {pillar.title}
              </Text>
              <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                {pillar.body}
              </Text>
            </SectionCard>
          ))}
        </View>

        <View style={{ marginTop: Spacing.xl, flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
          {[
            {
              href: '/security' as any,
              title: 'Security page',
              body: 'See how MoneyKai talks about authentication, backups, and account protection expectations.',
            },
            {
              href: '/privacy-policy' as const,
              title: 'Privacy policy',
              body: 'Read the public-facing explanation of what data is stored and how MoneyKai uses it.',
            },
            {
              href: '/financial-first-aid' as any,
              title: 'Financial first aid',
              body: 'Understand the new framing for urgent money situations and practical next steps.',
            },
          ].map((item) => (
            <Link key={item.href} href={item.href} asChild>
              <TouchableOpacity activeOpacity={0.82} style={{ flex: 1 }}>
                <SectionCard>
                  <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {item.title}
                  </Text>
                  <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                    {item.body}
                  </Text>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: Spacing.md,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: 10,
                      borderRadius: BorderRadius.full,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      Open page
                    </Text>
                  </View>
                </SectionCard>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </PublicShell>
    </>
  );
}
