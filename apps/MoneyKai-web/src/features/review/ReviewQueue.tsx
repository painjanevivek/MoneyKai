import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { ReviewItem } from '@/types/review';
import { Button } from '@/components/ui/Button';
import { SurfaceState } from '@/components/ui/SurfaceState';

interface Props {
  items: ReviewItem[];
  selectedId?: string;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onRetry: () => void;
  onLoadMore: (() => void) | null;
}

export function ReviewQueue({ items, selectedId, loading, loadingMore, error, onSelect, onRetry, onLoadMore }: Props) {
  const { colors } = useTheme();
  if (loading) {
    return <SurfaceState kind="loading" headline="Loading review queue" detail="MoneyKai is fetching a bounded first page of unresolved evidence." />;
  }
  if (error && items.length === 0) {
    return <SurfaceState kind="error" headline="Review queue unavailable" detail={error} primaryAction={<Button title="Try again" onPress={onRetry} variant="outline" size="sm" />} />;
  }
  if (items.length === 0) {
    return <SurfaceState kind="empty" icon="check-circle-outline" headline="Nothing needs review" detail="New imported or reconciled records will appear here with their evidence." />;
  }
  return (
    <View accessibilityRole="list" style={{ gap: Spacing.sm }}>
      {items.map((item) => {
        const selected = item.id === selectedId;
        const priorityColor = item.priority === 'critical' || item.priority === 'high' ? colors.warning : item.priority === 'medium' ? colors.primary : colors.textTertiary;
        return <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${item.title}, ${item.priority} priority`} onPress={() => onSelect(item.id)} style={({ hovered, pressed, focused }: any) => ({ padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: selected || focused ? colors.primary : colors.borderLight, backgroundColor: selected || hovered ? colors.primaryBg : colors.card, opacity: pressed ? 0.86 : 1 })}><View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}><View style={{ width: 34, height: 34, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: `${priorityColor}16` }}><MaterialCommunityIcons name={item.status === 'deferred' ? 'clock-outline' : 'clipboard-text-search-outline'} size={18} color={priorityColor} /></View><View style={{ flex: 1, minWidth: 0 }}><Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }} numberOfLines={1}>{item.title}</Text><Text style={{ marginTop: 3, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }} numberOfLines={2}>{item.summary}</Text><Text style={{ marginTop: 7, fontSize: 11, fontFamily: Typography.fontFamily.semiBold, color: priorityColor }}>{item.priority.toUpperCase()} · {item.provenance.source.toUpperCase()}</Text></View></View></Pressable>;
      })}
      {onLoadMore ? <Button title={loadingMore ? 'Loading more' : 'Load more'} onPress={onLoadMore} loading={loadingMore} variant="outline" size="sm" /> : null}
    </View>
  );
}
