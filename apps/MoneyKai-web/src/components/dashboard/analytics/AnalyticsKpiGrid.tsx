import React from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type AnalyticsKpi = {
  id: string;
  label: string;
  value: string;
  comparison: string;
  trend: number;
  footnote: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tone?: 'positive' | 'negative' | 'neutral';
};

export function AnalyticsKpiGrid({ items, selectedId, onSelect }: { items: AnalyticsKpi[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const tablet = width < 1180;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
      {items.map((item) => {
        const selected = item.id === selectedId;
        const trendColor = item.tone === 'negative' || item.trend < 0 ? colors.error : item.trend > 0 ? colors.success : colors.textTertiary;
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.86}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${item.label}: ${item.value}. ${item.comparison}`}
            onPress={() => onSelect(item.id)}
            style={{
              flexGrow: 1,
              flexBasis: compact ? '100%' : tablet ? '46%' : '22%',
              minWidth: compact ? 0 : 230,
              minHeight: 190,
              padding: Spacing.lg,
              borderRadius: BorderRadius.lg,
              borderWidth: 1,
              borderColor: selected ? colors.primary : colors.borderLight,
              backgroundColor: selected ? colors.primaryBg : colors.card,
              justifyContent: 'space-between',
            }}
          >
            <View style={{ width: 42, height: 42, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.surface : colors.surfaceElevated, borderWidth: 1, borderColor: colors.borderLight }}>
              <MaterialCommunityIcons name={item.icon} size={20} color={selected ? colors.primary : colors.textSecondary} />
            </View>
            <View style={{ marginTop: Spacing.lg }}>
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>{item.label}</Text>
              <Text style={{ marginTop: 5, fontSize: Typography.fontSize['3xl'], lineHeight: Typography.lineHeight['3xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }} numberOfLines={1} adjustsFontSizeToFit>{item.value}</Text>
              <View style={{ marginTop: Spacing.sm, flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: trendColor }}>{item.comparison}</Text>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>· selected period</Text>
              </View>
              <Text style={{ marginTop: Spacing.md, fontSize: 11, color: colors.textTertiary }}>{item.footnote}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
