import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function GoalsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const challenges = useChallengeStore((s) => s.challenges);
  const totalXP = useChallengeStore((s) => s.totalXP);
  const activeChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.status === 'active'),
    [challenges]
  );
  const completedChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.status === 'completed'),
    [challenges]
  );
  const deactivatedChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.status === 'deactivated'),
    [challenges]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['4xl'] }}
      >
        <View style={{ gap: Spacing.xl }}>
          <Card>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
              Goals
            </Text>
            <Text style={{ marginTop: 6, fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22, maxWidth: 760 }}>
              MoneyKai uses the existing challenge system as a practical goal tracker so users can stay motivated without needing a fake goals engine.
            </Text>
          </Card>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
            <Card style={{ flex: 1, minWidth: 220 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Active goals</Text>
              <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary, marginTop: 4 }}>
                {activeChallenges.length}
              </Text>
            </Card>
            <Card style={{ flex: 1, minWidth: 220 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Completed goals</Text>
              <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary, marginTop: 4 }}>
                {completedChallenges.length}
              </Text>
            </Card>
            <Card style={{ flex: 1, minWidth: 220 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Deactivated</Text>
              <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary, marginTop: 4 }}>
                {deactivatedChallenges.length}
              </Text>
            </Card>
            <Card style={{ flex: 1, minWidth: 220 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Total XP</Text>
              <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.textPrimary, marginTop: 4 }}>
                {totalXP}
              </Text>
            </Card>
          </View>

          {activeChallenges.length > 0 ? (
            <View style={{ gap: Spacing.md }}>
              {activeChallenges.map((challenge) => {
                const progress = (challenge.current_streak / Math.max(1, challenge.duration_days)) * 100;
                return (
                  <Card key={challenge.id}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                          {challenge.name}
                        </Text>
                        <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
                          {challenge.description}
                        </Text>
                      </View>
                      <View style={{ paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: colors.primaryBg }}>
                        <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.primary }}>
                          Active
                        </Text>
                      </View>
                    </View>
                    <View style={{ marginTop: Spacing.md }}>
                      <ProgressBar progress={progress} showLabel label={`Day ${challenge.current_streak} of ${challenge.duration_days}`} />
                    </View>
                  </Card>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon="target"
              title="No active goals yet"
              message="Start a challenge from Reports to track a real goal and build a consistent habit."
              action={<Button title="Open Reports" onPress={() => router.push('/reports' as any)} />}
            />
          )}

          <Card>
            <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
              Completed goals
            </Text>
            {completedChallenges.length > 0 ? (
              <View style={{ gap: 10 }}>
                {completedChallenges.map((challenge) => (
                  <View
                    key={challenge.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 10,
                      borderTopWidth: 1,
                      borderTopColor: colors.borderLight,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                        {challenge.name}
                      </Text>
                      <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
                        {challenge.description}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
                        {challenge.xp_earned} XP
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22 }}>
                Completed goals will appear here after a challenge is finished.
              </Text>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
