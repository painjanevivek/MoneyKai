import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View, useWindowDimensions } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const ACTIONS = [
  {
    title: 'Pause the panic loop',
    body: 'Start by seeing what is due, what cash is available, and what can wait. Clarity is the first intervention.',
  },
  {
    title: 'Protect essentials first',
    body: 'Rent, food, medicine, transport, and account access come before optimization. MoneyKai frames urgent choices around stability, not shame.',
  },
  {
    title: 'Cut complexity quickly',
    body: 'When money is tight, fewer moving parts matter. Shared visibility, notes, and backups help prevent avoidable confusion.',
  },
  {
    title: 'Build the next layer',
    body: 'After the immediate pressure reduces, savings habits, tracking, and routine reviews can help prevent the next emergency from feeling as sudden.',
  },
];

export default function FinancialFirstAidScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  return (
    <>
      <SeoHead
        title="MoneyKai Financial First Aid | Practical money support"
        description="MoneyKai reframes emergency money support into financial first aid: practical steps for clarity, essentials, continuity, and recovery."
        path="/financial-first-aid"
        keywords={['financial first aid', 'money emergency help', 'budget recovery plan', 'cash flow triage']}
      />
      <PublicShell
        eyebrow="Financial first aid"
        title="Money stress needs practical support, not alarm-heavy branding."
        description="MoneyKai frames financial first aid as a calmer way to handle urgent money moments, protect essentials, and take the next clear step."
      >
        <SectionCard>
          <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
            What financial first aid means in MoneyKai
          </Text>
          <Text style={{ marginTop: 10, fontSize: Typography.fontSize.md, lineHeight: 24, color: colors.textSecondary }}>
            It means helping people slow down, see the real situation, protect the basics, and recover their footing. The purpose is steadiness, not fear.
          </Text>
        </SectionCard>

        <View style={{ marginTop: Spacing.xl, flexDirection: isWide ? 'row' : 'column', gap: Spacing.md, flexWrap: 'wrap' }}>
          {ACTIONS.map((item, index) => (
            <SectionCard key={item.title} style={{ flex: 1, minWidth: isWide ? 240 : undefined }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: colors.primaryBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: Spacing.md,
                }}
              >
                <MaterialCommunityIcons name="medical-bag" size={22} color={colors.primary} />
              </View>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                ACTION {index + 1}
              </Text>
              <Text style={{ marginTop: 6, fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                {item.title}
              </Text>
              <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
                {item.body}
              </Text>
            </SectionCard>
          ))}
        </View>
      </PublicShell>
    </>
  );
}
