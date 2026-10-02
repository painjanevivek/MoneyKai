import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DashboardTrendCard } from '@/components/dashboard/DashboardTrendCard';
import { CenteredPageHeader } from '@/components/ui/CenteredPageHeader';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { Button } from '@/components/ui/Button';
import { AppIcon } from '@/components/ui/AppIcon';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getGraphRangeLabel, getGraphRangeDescription, GRAPH_METRIC_OPTIONS, GRAPH_RANGE_OPTIONS, GRAPH_TYPE_OPTIONS } from '@/utils/dashboardGraph';
import { graphViewsEqual, reduceGraphViewDraft } from '@/utils/graphViewDraft';
import { createAppScreenStyles } from './screenStyles';

export function GraphInsightsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const [now, setNow] = useState(() => new Date());
  const [openField, setOpenField] = useState<string | null>(null);
  useFocusEffect(useCallback(() => { setNow(new Date()); }, []));
  const savedRange = useSettingsStore((state) => state.dashboardTrendRange);
  const savedMetric = useSettingsStore((state) => state.dashboardTrendMetric);
  const savedType = useSettingsStore((state) => state.dashboardTrendChartType);
  const setPreferences = useSettingsStore((state) => state.setDashboardTrendPreferences);
  const [draft, dispatch] = useReducer(reduceGraphViewDraft, {
    view: { range: savedRange, metric: savedMetric, type: savedType },
    saved: { range: savedRange, metric: savedMetric, type: savedType },
  });
  useEffect(() => {
    dispatch({ type: 'saved', view: { range: savedRange, metric: savedMetric, type: savedType } });
  }, [savedRange, savedMetric, savedType]);
  const { range, metric, type } = draft.view;
  const unsaved = !graphViewsEqual(draft.view, { range: savedRange, metric: savedMetric, type: savedType });
  const toggleField = (field: string) => setOpenField((current) => current === field ? null : field);
  return <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
    <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Spacing['3xl'] }]} showsVerticalScrollIndicator={false}>
      <CenteredPageHeader title="Your graphs" leftAction={<ScreenBackButton compact />} />
      <Text accessibilityRole="header" style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, marginBottom: Spacing.sm }}>{GRAPH_METRIC_OPTIONS.find((option) => option.id === metric)?.label} · {GRAPH_TYPE_OPTIONS.find((option) => option.id === type)?.label}</Text>
      <DashboardTrendCard now={now} view={draft.view} graphAction={{ kind: 'transactions', onPress: (context) => navigation.navigate('GraphTransactions', context) }} />
      <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, marginTop: Spacing.sm, marginBottom: Spacing.lg }}>{type === 'donut' ? metric === 'netFlow' ? 'Pie shares compare gross credit and debit across the shown periods. Use a line or bar chart to see signed net flow.' : 'Each share shows a category across the shown periods. Older and Newer browse the same history as line and bar charts.' : 'Each point is one calendar period, oldest to newest from left to right. Older and Newer let you explore history beyond the chart’s width.'}</Text>
      <GraphChoiceField label="Metric" value={GRAPH_METRIC_OPTIONS.find((option) => option.id === metric)?.label ?? ''} expanded={openField === 'metric'} onToggle={() => toggleField('metric')}>
        {GRAPH_METRIC_OPTIONS.map((option) => <GraphChoice key={option.id} label={option.label} description={option.description} selected={metric === option.id} onPress={() => { dispatch({ type: 'edit', changes: { metric: option.id } }); setOpenField(null); }} />)}
      </GraphChoiceField>
      <GraphChoiceField label="Group by" value={getGraphRangeLabel(range)} expanded={openField === 'range'} onToggle={() => toggleField('range')}>
        {GRAPH_RANGE_OPTIONS.map((option) => <GraphChoice key={option.id} label={getGraphRangeLabel(option.id)} description={getGraphRangeDescription(option.id)} selected={range === option.id} onPress={() => { dispatch({ type: 'edit', changes: { range: option.id } }); setOpenField(null); }} />)}
      </GraphChoiceField>
      <GraphChoiceField label="Style" value={GRAPH_TYPE_OPTIONS.find((option) => option.id === type)?.label ?? ''} expanded={openField === 'type'} onToggle={() => toggleField('type')}>
        {GRAPH_TYPE_OPTIONS.map((option) => <GraphChoice key={option.id} label={option.label} description={option.description} selected={type === option.id} onPress={() => { dispatch({ type: 'edit', changes: { type: option.id } }); setOpenField(null); }} />)}
      </GraphChoiceField>
      <View style={{ marginTop: Spacing.lg, gap: Spacing.sm }}>
        <Text accessibilityLiveRegion="polite" style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm }}>{unsaved ? 'Exploring a different view. Home still uses your saved view.' : 'This view is saved on Home.'}</Text>
        <Button title="Use this view on Home" disabled={!unsaved} onPress={() => {
          setPreferences({ dashboardTrendRange: range, dashboardTrendMetric: metric, dashboardTrendChartType: type });
          dispatch({ type: 'saved', view: draft.view });
        }} />
        {unsaved ? <Button title="Reset to Home view" variant="ghost" onPress={() => dispatch({ type: 'reset' })} /> : null}
      </View>
    </ScrollView>
  </SafeAreaView>;
}

function GraphChoiceField({ label, value, expanded, onToggle, children }: { label: string; value: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={{ borderTopColor: colors.borderLight, borderTopWidth: 1 }}>
    <PressableScale accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} accessibilityState={{ expanded }} onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minHeight: 48, paddingVertical: Spacing.sm }}>
      <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm }}>{label}</Text>
      <Text style={{ flex: 1, textAlign: 'right', color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm }}>{value}</Text>
      <AppIcon name={expanded ? 'chevron-up' : 'chevron-down'} color={colors.textSecondary} size={18} />
    </PressableScale>
    {expanded ? <View style={{ paddingBottom: Spacing.sm }}>{children}</View> : null}
  </View>;
}

function GraphChoice({ label, description, selected, onPress }: { label: string; description: string; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return <PressableScale accessibilityRole="radio" accessibilityLabel={`${label}. ${description}`} accessibilityState={{ checked: selected }} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minHeight: 48, paddingVertical: Spacing.sm }}>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={{ color: colors.textPrimary, fontFamily: selected ? Typography.fontFamily.semiBold : Typography.fontFamily.regular, fontSize: Typography.fontSize.sm }}>{label}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs }}>{description}</Text>
    </View>
    {selected ? <AppIcon name="check" color={colors.textPrimary} size={20} /> : null}
  </PressableScale>;
}
