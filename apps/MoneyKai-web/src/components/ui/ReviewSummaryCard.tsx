import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ReviewSummaryTone = 'primary' | 'success' | 'warning' | 'neutral';

interface ReviewSummaryCardProps {
  eyebrow: string;
  title: string;
  body: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tone: ReviewSummaryTone;
  rows: string[][];
}

export const ReviewSummaryCard: React.FC<ReviewSummaryCardProps> = ({
  eyebrow,
  title,
  body,
  icon,
  tone,
  rows,
}) => {
  const { colors } = useTheme();
  const toneColor = tone === 'success'
    ? colors.success
    : tone === 'warning'
      ? colors.warning
      : tone === 'primary'
        ? colors.primary
        : colors.textSecondary;

  return (
    <Card style={{ gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
        <View style={{ width: 38, height: 38, borderRadius: BorderRadius.sm, backgroundColor: `${toneColor}16`, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name={icon} size={19} color={toneColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
            {eyebrow}
          </Text>
          <Text style={{ marginTop: 3, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            {title}
          </Text>
          <Text style={{ marginTop: 4, fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
            {body}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        {rows.map(([label, value]) => (
          <View key={label} style={{ flex: 1, minWidth: 135, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>{label}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 2, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              {value}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
};

export default ReviewSummaryCard;
