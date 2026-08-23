import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SurfaceState } from '@/components/ui/SurfaceState';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { RecurringObligation, RecurringObligationCandidate } from '@/types/planning';
import { formatCurrency } from '@/utils/formatCurrency';

interface Props {
  candidates: RecurringObligationCandidate[];
  decisions: RecurringObligation[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  pendingId: string | null;
  onDecision: (candidate: RecurringObligationCandidate, action: 'confirm' | 'dismiss') => Promise<void>;
  onRetry: () => Promise<void>;
}

export function RecurringObligationsPanel({ candidates, decisions, status, error, pendingId, onDecision, onRetry }: Props) {
  const { colors } = useTheme();
  const confirmed = decisions.filter((item) => item.status === 'confirmed');
  const [expanded, setExpanded] = React.useState(false);
  const visibleCandidates = expanded ? candidates : candidates.slice(0, 3);
  const visibleConfirmed = expanded ? confirmed : confirmed.slice(0, 3);
  const hiddenCount = Math.max(0, candidates.length - visibleCandidates.length)
    + Math.max(0, confirmed.length - visibleConfirmed.length);

  return (
    <Card style={{ gap: Spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
        <View style={{ width: 38, height: 38, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryBg }}>
          <MaterialCommunityIcons name="calendar-sync-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text accessibilityRole="header" style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
            Recurring obligations
          </Text>
          <Text style={{ marginTop: 4, fontSize: Typography.fontSize.sm, lineHeight: 21, color: colors.textSecondary }}>
            Patterns are estimates until you confirm them. Only confirmed obligations affect safe-to-spend and forecast facts.
          </Text>
        </View>
      </View>

      {status === 'loading' || status === 'idle' ? <SurfaceState kind="loading" headline="Loading planning decisions" detail="Confirmed and dismissed patterns are being reconciled." /> : null}
      {status === 'error' ? <SurfaceState kind="error" headline="Planning decisions unavailable" detail={error ?? 'Try again before relying on the forecast.'} primaryAction={<Button title="Try again" onPress={() => void onRetry()} variant="outline" size="sm" />} /> : null}
      {status !== 'error' && error ? (
        <View accessibilityRole="alert" style={{ padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: `${colors.warning}55`, backgroundColor: `${colors.warning}10`, gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.warning }}>{error}</Text>
          <Button title="Refresh decisions" onPress={() => void onRetry()} variant="ghost" size="sm" />
        </View>
      ) : null}

      {status === 'ready' && candidates.length === 0 && confirmed.length === 0 ? <SurfaceState kind="empty" headline="No recurring pattern needs review" detail="MoneyKai needs at least two consistent monthly records before it proposes an obligation." /> : null}

      {candidates.length > 0 ? (
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>NEEDS CONFIRMATION</Text>
          {visibleCandidates.map((candidate) => (
            <View key={candidate.id} style={{ padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surfaceElevated, gap: Spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{candidate.label}</Text>
                  <Text style={{ marginTop: 3, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                    {formatCurrency(candidate.amount)} · expected {candidate.nextDueDate} · based on {candidate.sourceTransactionIds.length} records
                  </Text>
                </View>
                <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.semiBold, color: colors.warning }}>ESTIMATE</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                <Button title="Confirm" onPress={() => void onDecision(candidate, 'confirm')} loading={pendingId === candidate.id} disabled={pendingId !== null && pendingId !== candidate.id} size="sm" />
                <Button title="Not recurring" onPress={() => void onDecision(candidate, 'dismiss')} disabled={pendingId !== null} variant="ghost" size="sm" />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {confirmed.length > 0 ? (
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>CONFIRMED FACTS</Text>
          {visibleConfirmed.map((item) => (
            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{item.label}</Text>
                <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{formatCurrency(item.amount)} monthly · next due {item.nextDueDate}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {expanded || hiddenCount > 0 ? (
        <Button
          title={expanded ? 'Show less' : `Show ${hiddenCount} more`}
          onPress={() => setExpanded((current) => !current)}
          variant="ghost"
          size="sm"
        />
      ) : null}
    </Card>
  );
}
