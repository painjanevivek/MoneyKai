import React from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Button } from '@/components/ui/Button';
import { WorkspaceHeader } from '@/components/ui/WorkspaceHeader';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { ReviewFilters, ReviewItemStatus, ReviewSource } from '@/types/review';
import { ReviewDetail } from './ReviewDetail';
import { ReviewQueue } from './ReviewQueue';
import { useReviewWorkspace } from './useReviewWorkspace';

const STATUS_OPTIONS: { label: string; value?: ReviewItemStatus }[] = [{ label: 'All' }, { label: 'Pending', value: 'pending' }, { label: 'Deferred', value: 'deferred' }, { label: 'Approved', value: 'approved' }, { label: 'Ignored', value: 'ignored' }];
const SOURCE_OPTIONS: { label: string; value?: ReviewSource }[] = [{ label: 'Every source' }, { label: 'SMS', value: 'sms' }, { label: 'Gmail', value: 'gmail' }, { label: 'PDF', value: 'pdf' }, { label: 'Manual', value: 'manual' }];

interface Props {
  initialFilters: ReviewFilters;
  initialItemId?: string;
  onFiltersChange: (filters: ReviewFilters, selectedId?: string) => void;
  onOpenDashboard: () => void;
}

export function ReviewWorkspace({ initialFilters, initialItemId, onFiltersChange, onOpenDashboard }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 980;
  const workspace = useReviewWorkspace(initialFilters, initialItemId);

  React.useEffect(() => {
    onFiltersChange(workspace.filters, workspace.selectedItem?.id);
  }, [onFiltersChange, workspace.filters, workspace.selectedItem?.id]);

  return (
    <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ gap: Spacing.lg, paddingBottom: Spacing['3xl'] }}>
      <WorkspaceHeader eyebrow="DAILY REVIEW" icon="clipboard-text-search-outline" title="Review before it changes your money" description="Resolve imported and reconciled evidence with one clear decision at a time. Nothing enters canonical totals until an allowed action confirms it." metrics={[{ label: 'Visible queue', value: String(workspace.items.length) }, { label: 'Pending', value: String(workspace.items.filter((item) => item.status === 'pending').length), tone: 'warning' }, { label: 'Deferred', value: String(workspace.items.filter((item) => item.status === 'deferred').length) }]} actions={<Button title="Open dashboard" icon="view-dashboard-outline" variant="outline" onPress={onOpenDashboard} />} />

      {workspace.lastAction ? <View accessibilityLiveRegion="polite" style={{ padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.success, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}><Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: colors.textPrimary }}>{workspace.lastAction.receipt.replayed ? 'The original confirmed action was safely replayed.' : 'Review action confirmed.'} Correlation: {workspace.lastAction.receipt.correlationId}</Text><Button title="Dismiss" onPress={workspace.clearLastAction} variant="ghost" size="sm" /></View> : null}
      {workspace.error && workspace.items.length > 0 ? <View accessibilityRole="alert" style={{ padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surfaceElevated }}><Text style={{ color: colors.error }}>{workspace.error}</Text></View> : null}

      <View style={{ gap: Spacing.sm }}><Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>STATUS</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>{STATUS_OPTIONS.map((option) => <FilterChip key={option.label} label={option.label} selected={workspace.filters.status === option.value} onPress={() => workspace.setFilters((current) => ({ ...current, status: option.value }))} />)}</View><Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>SOURCE</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>{SOURCE_OPTIONS.map((option) => <FilterChip key={option.label} label={option.label} selected={workspace.filters.source === option.value} onPress={() => workspace.setFilters((current) => ({ ...current, source: option.value }))} />)}</View></View>

      <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: 'flex-start', gap: Spacing.lg }}><View style={{ width: wide ? 360 : '100%', minWidth: 0 }}><ReviewQueue items={workspace.items} selectedId={workspace.selectedItem?.id} loading={workspace.loading} loadingMore={workspace.loadingMore} error={workspace.error} onSelect={workspace.selectItem} onRetry={workspace.retry} onLoadMore={workspace.loadMore} /></View><View style={{ flex: 1, width: wide ? undefined : '100%', minWidth: 0 }}><ReviewDetail key={`${workspace.selectedItem?.id ?? 'empty'}:${workspace.selectedItem?.revision ?? 0}`} item={workspace.selectedItem} busy={workspace.actioning} onAction={workspace.performAction} /></View></View>
    </ScrollView>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ hovered, focused }: any) => ({ minHeight: 36, justifyContent: 'center', paddingHorizontal: Spacing.md, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: selected || focused ? colors.primary : colors.borderLight, backgroundColor: selected || hovered ? colors.primaryBg : colors.card })}><Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: selected ? colors.primary : colors.textSecondary }}>{label}</Text></Pressable>;
}
