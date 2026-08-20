import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getCategoryById } from '../../constants/categories';
import { BorderRadius, Spacing, Typography } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import type { SpendingTrendInsight } from '../../utils/dashboard';
import { formatCurrency } from '../../utils/formatCurrency';

type SpendingTrendInsightCardProps = {
  insight: SpendingTrendInsight;
  onPress?: () => void;
};

const formatPercentage = (value: number) => `${Math.round(Math.abs(value))}%`;

export const SpendingTrendInsightCard: React.FC<SpendingTrendInsightCardProps> = ({ insight, onPress }) => {
  const { colors } = useTheme();
  const categoryName = getCategoryById(insight.category)?.name ?? insight.category;
  const isUncategorized = insight.kind === 'uncategorized-spend';
  const isIncrease = insight.kind === 'category-change' && insight.direction === 'up';
  const isDecrease = insight.kind === 'category-change' && insight.direction === 'down';
  const emphasisColor = isUncategorized || isIncrease ? colors.warning : isDecrease ? colors.success : colors.info;
  const icon = isUncategorized
    ? 'tag-alert-outline'
    : isIncrease
      ? 'trending-up'
      : isDecrease
        ? 'trending-down'
        : 'new-box';

  const copy = isUncategorized
    ? {
        title: `${formatCurrency(insight.currentAmount)} in ${categoryName} needs review`,
        body: `${Math.round(insight.shareOfSpend * 100)}% of this month’s spending is waiting to be categorised.`,
        actionLabel: 'View spending details',
      }
    : insight.direction === 'new'
      ? {
          title: `New ${categoryName} spending`,
          body: `${formatCurrency(insight.currentAmount)} was added this month.`,
          actionLabel: 'View spending details',
        }
      : {
          title: `${categoryName} spending is ${insight.direction === 'up' ? 'up' : 'down'} ${formatPercentage(insight.changePercent ?? 0)}`,
          body: `${formatCurrency(insight.currentAmount)} this month · ${formatCurrency(Math.abs(insight.changeAmount))} ${insight.direction === 'up' ? 'more' : 'less'} than last month.`,
          actionLabel: 'View spending details',
        };

  const content = (
    <>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: BorderRadius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${emphasisColor}18`,
        }}
      >
        <MaterialCommunityIcons name={icon} size={19} color={emphasisColor} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={2}
          style={{ fontSize: Typography.fontSize.sm, lineHeight: 18, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}
        >
          {copy.title}
        </Text>
        <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, lineHeight: 17, color: colors.textSecondary }}>
          {copy.body}
        </Text>
      </View>
      {onPress ? <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} /> : null}
    </>
  );

  if (!onPress) {
    return <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>{content}</View>;
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={copy.actionLabel}
      accessibilityHint="Opens the selected month's spending details"
      activeOpacity={0.78}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: Spacing.sm }}
    >
      {content}
    </TouchableOpacity>
  );
};
