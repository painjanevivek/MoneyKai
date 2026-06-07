import React from 'react';
import { Text, View } from 'react-native';
import { PublicShell, SectionCard } from '@/components/marketing/PublicShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function EmergencyFundArticleScreen() {
  const { colors } = useTheme();

  return (
    <>
      <SeoHead
        title="What financial first aid looks like before a full emergency fund exists | MoneyKai Learn"
        description="A practical guide for handling urgent money pressure when your emergency fund is still small or not fully built."
        path="/learn/emergency-fund"
        keywords={['financial first aid', 'emergency fund basics', 'cash flow recovery']}
      />
      <PublicShell
        eyebrow="MoneyKai Learn"
        title="What financial first aid looks like before a full emergency fund exists"
        description="A missing or incomplete emergency fund does not mean you have no options. It means the first response should be structured and calm."
      >
        <View style={{ gap: Spacing.md }}>
          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              First aid starts with a short list
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              In a money emergency, the first list should be small: available cash, due dates, essential obligations, and anything that can be delayed or renegotiated. This is why a finance app needs strong visibility before it needs complicated advice.
            </Text>
          </SectionCard>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Protect continuity
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              Account access, records, notes, and backup continuity matter in hard moments because confusion adds cost. Good financial first aid reduces avoidable mistakes and keeps the picture stable enough to act on.
            </Text>
          </SectionCard>

          <SectionCard>
            <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Recovery is the next phase
            </Text>
            <Text style={{ marginTop: 10, fontSize: Typography.fontSize.sm, lineHeight: 24, color: colors.textSecondary }}>
              After the immediate issue passes, even a small recurring savings habit changes the next response. Recovery does not begin when life feels perfect. It begins when the urgent moment becomes visible enough to plan around.
            </Text>
          </SectionCard>
        </View>
      </PublicShell>
    </>
  );
}
