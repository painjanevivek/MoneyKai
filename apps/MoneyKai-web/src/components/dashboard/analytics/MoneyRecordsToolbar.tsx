import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { MoneyRecordsTypeFilter } from './moneyRecords.types';

const FILTERS: readonly MoneyRecordsTypeFilter[] = ['all', 'income', 'expense'];
const displayText = (value: string) => value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

interface Props {
  compact: boolean;
  recordCount: number;
  previewCount: number;
  selectedCount: number;
  typeFilter: MoneyRecordsTypeFilter;
  onChangeFilter: (filter: MoneyRecordsTypeFilter) => void;
  onReset: () => void;
  onExport: () => void;
}

export function MoneyRecordsToolbar({ compact, recordCount, previewCount, selectedCount, typeFilter, onChangeFilter, onReset, onExport }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ padding: Spacing.lg, flexDirection: compact ? 'column' : 'row', alignItems: compact ? 'stretch' : 'center', justifyContent: 'space-between', gap: Spacing.md }}>
      <View style={{ flexShrink: 1 }}>
        <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>Money records</Text>
        <Text accessibilityLiveRegion="polite" style={{ marginTop: 4, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
          {selectedCount > 0
            ? `${selectedCount} of ${previewCount} visible records selected`
            : `${recordCount} reviewed record${recordCount === 1 ? '' : 's'} in the selected period`}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        {FILTERS.map((type) => {
          const active = typeFilter === type;
          return (
            <TouchableOpacity key={type} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => onChangeFilter(type)} style={{ minHeight: 40, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: active ? colors.primary : colors.borderLight, backgroundColor: active ? colors.primaryBg : colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: active ? Typography.fontFamily.semiBold : Typography.fontFamily.regular, color: active ? colors.primary : colors.textSecondary }}>{displayText(type)}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Reset record filters, sorting, and selection" onPress={onReset} style={{ minHeight: 40, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <MaterialCommunityIcons name="filter-remove-outline" size={17} color={colors.textTertiary} />
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Export records in the current dashboard period" onPress={onExport} style={{ minHeight: 40, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <MaterialCommunityIcons name="file-download-outline" size={17} color={colors.textSecondary} />
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>Export</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
