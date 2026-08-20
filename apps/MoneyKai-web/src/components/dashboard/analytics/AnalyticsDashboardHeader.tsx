import React from 'react';
import { Modal, Pressable, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { ANALYTICS_RANGE_OPTIONS, type AnalyticsRange } from './types';

type HeaderAction = { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; onPress: () => void };

interface Props {
  range: AnalyticsRange;
  searchQuery: string;
  onChangeRange: (value: AnalyticsRange) => void;
  onChangeSearch: (value: string) => void;
  onExport: () => void;
  onAddTransaction: () => void;
  onOpenAiReview: () => void;
  onCustomizeLayout: () => void;
  layoutCustomized: boolean;
  secondaryActions: HeaderAction[];
}

function ActionButton({ label, icon, onPress, primary = false }: HeaderAction & { primary?: boolean }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity activeOpacity={0.82} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ minHeight: 44, paddingHorizontal: Spacing.base, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: primary ? colors.primary : colors.border, backgroundColor: primary ? colors.primary : colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }}>
      <MaterialCommunityIcons name={icon} size={19} color={primary ? colors.textInverse : colors.textSecondary} />
      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: primary ? colors.textInverse : colors.textPrimary }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function AnalyticsDashboardHeader({ range, searchQuery, onChangeRange, onChangeSearch, onExport, onAddTransaction, onOpenAiReview, onCustomizeLayout, layoutCustomized, secondaryActions }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const [showNewMenu, setShowNewMenu] = React.useState(false);

  return (
    <View style={{ gap: Spacing.lg }}>
      <View style={{ flexDirection: compact ? 'column' : 'row', justifyContent: 'space-between', alignItems: compact ? 'stretch' : 'center', gap: Spacing.md }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: Typography.fontSize.xs, letterSpacing: 1.2, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>FINANCIAL COMMAND CENTER</Text>
          <Text style={{ marginTop: 5, fontSize: compact ? Typography.fontSize['3xl'] : Typography.fontSize['4xl'], lineHeight: compact ? Typography.lineHeight['3xl'] : Typography.lineHeight['4xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>Dashboard</Text>
          <Text style={{ marginTop: 4, maxWidth: 620, fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, color: colors.textSecondary }}>Monitor cashflow, spending pressure, and reviewed money records from one focused workspace.</Text>
        </View>
        <View style={{ flexDirection: compact ? 'column' : 'row', alignItems: 'stretch', gap: Spacing.sm }}>
          <View style={{ minWidth: compact ? undefined : 270, minHeight: 44, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <MaterialCommunityIcons name="magnify" size={19} color={colors.textTertiary} />
            <TextInput value={searchQuery} onChangeText={onChangeSearch} placeholder="Search money records" placeholderTextColor={colors.textTertiary} accessibilityLabel="Search dashboard money records" style={{ flex: 1, minWidth: 0, paddingVertical: 10, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: colors.textPrimary, outlineStyle: 'none' } as any} />
            {searchQuery ? <Pressable accessibilityRole="button" accessibilityLabel="Clear dashboard search" onPress={() => onChangeSearch('')} hitSlop={8}><MaterialCommunityIcons name="close-circle" size={17} color={colors.textTertiary} /></Pressable> : null}
          </View>
          <ActionButton label="AI review" icon="brain" onPress={onOpenAiReview} />
          <ActionButton label="Add transaction" icon="plus" onPress={onAddTransaction} primary />
        </View>
      </View>
      <View style={{ flexDirection: compact ? 'column' : 'row', alignItems: compact ? 'stretch' : 'center', justifyContent: 'space-between', gap: Spacing.md }}>
        <View accessibilityRole="tablist" style={{ alignSelf: compact ? 'stretch' : 'flex-start', padding: 4, borderRadius: BorderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, flexDirection: 'row' }}>
          {ANALYTICS_RANGE_OPTIONS.map((option) => {
            const selected = option.value === range;
            return <TouchableOpacity key={option.value} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChangeRange(option.value)} style={{ flex: compact ? 1 : undefined, minHeight: 38, minWidth: compact ? undefined : 104, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.surfaceElevated : 'transparent' }}><Text style={{ fontSize: Typography.fontSize.sm, fontFamily: selected ? Typography.fontFamily.semiBold : Typography.fontFamily.regular, color: selected ? colors.textPrimary : colors.textTertiary }}>{option.label}</Text></TouchableOpacity>;
          })}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          <ActionButton label={layoutCustomized ? 'Layout edited' : 'Customize layout'} icon="view-dashboard-edit-outline" onPress={onCustomizeLayout} />
          <ActionButton label="Export" icon="file-download-outline" onPress={onExport} />
          <ActionButton label="New" icon="plus" onPress={() => setShowNewMenu(true)} />
        </View>
      </View>
      <Modal transparent visible={showNewMenu} animationType="fade" onRequestClose={() => setShowNewMenu(false)}>
        <Pressable onPress={() => setShowNewMenu(false)} style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }}>
          <Pressable onPress={() => undefined} style={{ width: '100%', maxWidth: 420, borderRadius: BorderRadius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, padding: Spacing.md, gap: Spacing.xs }}>
            <View style={{ paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm }}><Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>Create new</Text><Text style={{ marginTop: 3, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Choose the next money task.</Text></View>
            {[{ label: 'Add transaction', icon: 'swap-horizontal' as const, onPress: onAddTransaction }, ...secondaryActions].map((action) => (
              <TouchableOpacity key={action.label} accessibilityRole="button" onPress={() => { setShowNewMenu(false); action.onPress(); }} style={{ minHeight: 50, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View style={{ width: 34, height: 34, borderRadius: BorderRadius.sm, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name={action.icon} size={18} color={colors.primary} /></View>
                <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>{action.label}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
