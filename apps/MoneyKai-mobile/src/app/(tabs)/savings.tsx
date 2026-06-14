import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-gifted-charts';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BudgetCoachPanel } from '@/components/budgets/BudgetCoachPanel';
import { SavingsAnalyticsSnapshot } from '@/components/charts/SavingsAnalyticsSnapshot';
import { getCategoryById } from '@/constants/categories';
import { CHALLENGE_TEMPLATES } from '@/types/challenge';
import { calculateSavingsProjection, calculateEmergencyBudget } from '@/utils/savingsEngine';
import { getDaysLeftInMonth } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/formatCurrency';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import type { CategoryReduction } from '@/types/budget';

const TABS = ['Savings Predictor', 'Challenges', 'Emergency'] as const;

export default function SavingsScreen() {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width > 900;
  const categoryTotals = useTransactionStore((s) => s.getCategoryTotals());
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const { settings, isEmergencyMode, toggleEmergencyMode } = useBudgetStore();
  const { startChallenge, getActiveChallenges, getDeactivatedChallenges, deactivateChallenge, reactivateChallenge, getDailyMotivation, totalXP } = useChallengeStore();
  const activeChallenges = getActiveChallenges();
  const deactivatedChallenges = getDeactivatedChallenges();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Savings Predictor');
  const [reductions, setReductions] = useState<Record<string, number>>({});
  const [showEmergencySuggestions, setShowEmergencySuggestions] = useState(false);

  const updateReduction = (category: string, percent: number) => {
    setReductions((prev) => ({ ...prev, [category]: percent }));
  };

  const categoryReductions: CategoryReduction[] = categoryTotals.map((cat) => ({
    category: cat.category,
    currentAmount: cat.total,
    reductionPercent: reductions[cat.category] || 0,
    savedAmount: 0,
  }));

  const projection = useMemo(
    () => calculateSavingsProjection(settings.monthly_allowance, categoryTotals, categoryReductions),
    [settings.monthly_allowance, categoryTotals, categoryReductions]
  );

  const emergencyBudget = calculateEmergencyBudget(settings.monthly_allowance - totalSpent, getDaysLeftInMonth());

  const handleToggleEmergencyMode = () => {
    if (isEmergencyMode) {
      setShowEmergencySuggestions(false);
      toggleEmergencyMode();
      return;
    }

    toggleEmergencyMode();
    Alert.alert(
      'Emergency mode activated',
      'Do you want practical survival suggestions for the rest of the month?',
      [
        { text: 'Not now', style: 'cancel', onPress: () => setShowEmergencySuggestions(false) },
        { text: 'Show suggestions', onPress: () => setShowEmergencySuggestions(true) },
      ]
    );
  };

  const comparisonData = React.useMemo(
    () => [
      { value: Math.max(0, projection.currentSavings), label: 'Current', frontColor: colors.textTertiary },
      { value: Math.max(0, projection.projectedSavings), label: 'Projected', frontColor: colors.primary },
    ],
    [projection, colors]
  );

  const renderSavingsPredictor = () => (
    <>
      <BudgetCoachPanel />

      <View
        style={{
          flexDirection: isWide ? 'row' : 'column',
          gap: Spacing.md,
          marginBottom: Spacing.md,
        }}
      >
        <Card style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>
            Savings Projection
          </Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: colors.borderLight }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>Current Trajectory</Text>
              <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
                {formatCurrency(Math.max(0, projection.currentSavings))}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.primaryBg, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: `${colors.primary}30` }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.primary }}>After Reductions</Text>
              <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.primary }}>
                {formatCurrency(Math.max(0, projection.projectedSavings))}
              </Text>
            </View>
          </View>
          {projection.improvement > 0 && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: colors.primaryBg,
                borderRadius: BorderRadius.sm,
                padding: Spacing.md,
              }}
            >
              <MaterialCommunityIcons name="trending-up" size={20} color={colors.primary} />
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.primary }}>
                You could save {formatCurrency(projection.improvement)} more! ({projection.improvementPercent}% improvement)
              </Text>
            </View>
          )}
          <View style={{ alignItems: 'center', marginTop: Spacing.md }}>
            <BarChart
              data={comparisonData}
              barWidth={50}
              spacing={40}
              roundedTop
              roundedBottom
              height={120}
              noOfSections={3}
              yAxisTextStyle={{ fontSize: 10, color: colors.textTertiary }}
              xAxisLabelTextStyle={{ fontSize: 10, color: colors.textSecondary, fontFamily: Typography.fontFamily.medium }}
              hideRules
              yAxisColor="transparent"
              xAxisColor="transparent"
              isAnimated
              yAxisLabelPrefix="₹"
            />
          </View>
        </Card>

        <SavingsAnalyticsSnapshot />
      </View>

      <Card style={{ marginBottom: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: 4 }}>
          Adjust Category Spending
        </Text>
        <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary, marginBottom: Spacing.md }}>
          Use sliders to simulate reducing spending in each category
        </Text>
        {categoryTotals.slice(0, 6).map((cat) => {
          const category = getCategoryById(cat.category);
          const reduction = reductions[cat.category] || 0;
          const saved = Math.round(cat.total * (reduction / 100));
          return (
            <View key={cat.category} style={{ marginBottom: Spacing.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name={(category?.icon || 'help') as any} size={16} color={category?.color || colors.textSecondary} />
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                    {category?.name?.split(' &')[0] || cat.category}
                  </Text>
                </View>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
                  -{reduction}% {saved > 0 ? `(saves ${formatCurrency(saved)})` : ''}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[0, 10, 20, 30, 50].map((pct) => (
                  <TouchableOpacity
                    key={pct}
                    onPress={() => updateReduction(cat.category, pct)}
                    style={{
                      flex: 1,
                      paddingVertical: 6,
                      borderRadius: BorderRadius.sm,
                      alignItems: 'center',
                      backgroundColor: reduction === pct ? (isDark ? colors.textPrimary : colors.primary) : colors.surface,
                      borderWidth: 1,
                      borderColor: reduction === pct ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: Typography.fontFamily.medium,
                        color: reduction === pct ? (isDark ? colors.textInverse : colors.textInverse) : colors.textPrimary,
                      }}
                    >
                      {pct}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </Card>

      {projection.recommendations.length > 0 && (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md }}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.accent} />
            <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>AI Recommendations</Text>
          </View>
          {projection.recommendations.map((rec, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                gap: 8,
                paddingVertical: Spacing.sm,
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: colors.borderLight,
              }}
            >
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.primary} style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary, lineHeight: 20 }}>{rec}</Text>
            </View>
          ))}
        </Card>
      )}
    </>
  );

  const renderChallenges = () => (
    <>
      <Card style={{ marginBottom: Spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>Total XP Earned</Text>
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: colors.primary }}>{totalXP} XP</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <MaterialCommunityIcons name="star-circle" size={40} color={colors.accent} />
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.accent }}>Level {Math.floor(totalXP / 500) + 1}</Text>
          </View>
        </View>
      </Card>

      <View
        style={{
          backgroundColor: colors.primaryBg,
          borderRadius: BorderRadius.md,
          padding: Spacing.md,
          marginBottom: Spacing.md,
          borderLeftWidth: 3,
          borderLeftColor: colors.primary,
        }}
      >
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.primary, lineHeight: 20 }}>
          {getDailyMotivation()}
        </Text>
      </View>

      {activeChallenges.length > 0 && (
        <>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>Active Challenges</Text>
          {activeChallenges.map((ch) => (
            <Card key={ch.id} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{ch.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <View style={{ backgroundColor: colors.primaryBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                    <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>Active</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        'Deactivate Challenge',
                        `Deactivate "${ch.name}"? You can keep the record and start a new challenge later.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Deactivate',
                            style: 'destructive',
                            onPress: () => {
                              deactivateChallenge(ch.id);
                              Alert.alert('Challenge deactivated', `"${ch.name}" moved to Deactivated Challenges.`);
                            },
                          },
                        ]
                      )
                    }
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: BorderRadius.full,
                      backgroundColor: colors.emergencyBg,
                      borderWidth: 1,
                      borderColor: `${colors.emergency}30`,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.semiBold, color: colors.emergency }}>
                      Deactivate
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginBottom: Spacing.sm }}>{ch.description}</Text>
              <ProgressBar
                progress={(ch.current_streak / ch.duration_days) * 100}
                color={colors.primary}
                height={6}
                showLabel
                label={`Day ${ch.current_streak} of ${ch.duration_days}`}
              />
            </Card>
          ))}
        </>
      )}

      {deactivatedChallenges.length > 0 && (
        <>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm }}>
            Deactivated Challenges
          </Text>
          {deactivatedChallenges.map((ch) => (
            <Card key={ch.id} style={{ marginBottom: Spacing.md, opacity: 0.92 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{ch.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>Deactivated</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => reactivateChallenge(ch.id)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: BorderRadius.full,
                      backgroundColor: colors.primaryBg,
                      borderWidth: 1,
                      borderColor: `${colors.primary}30`,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
                      Reactivate
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginBottom: Spacing.sm }}>{ch.description}</Text>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textTertiary }}>
                Last progress: Day {ch.current_streak} of {ch.duration_days}
              </Text>
            </Card>
          ))}
        </>
      )}

      <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm }}>Start a Challenge</Text>
      {CHALLENGE_TEMPLATES.map((template) => (
        <Card key={template.id} style={{ marginBottom: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: BorderRadius.md,
                backgroundColor: `${template.color}15`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name={template.icon as any} size={22} color={template.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{template.name}</Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>{template.description}</Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>{template.defaultDuration} days • Est. savings {formatCurrency(template.estimatedSavings)}</Text>
            </View>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: BorderRadius.full,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
                {template.difficulty}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                startChallenge({
                  name: template.name,
                  category: template.category,
                  description: template.description,
                  duration_days: template.defaultDuration,
                  start_date: new Date().toISOString().split('T')[0],
                  end_date: new Date(Date.now() + template.defaultDuration * 86400000).toISOString().split('T')[0],
                })
              }
              style={{ backgroundColor: colors.primaryBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full }}
            >
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>Start</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}
    </>
  );

  const renderEmergency = () => (
    <>
      <Card style={{ marginBottom: Spacing.md, borderWidth: isEmergencyMode ? 2 : 0, borderColor: colors.emergency }}>
        <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
          <TouchableOpacity
            onPress={handleToggleEmergencyMode}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: isEmergencyMode ? colors.emergency : `${colors.emergency}15`,
              alignItems: 'center',
              justifyContent: 'center',
              ...(isEmergencyMode ? Shadows.glow(colors.emergency) : {}),
              marginBottom: Spacing.md,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: isEmergencyMode ? colors.textInverse : colors.emergency }}>SOS</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: isEmergencyMode ? colors.emergency : colors.textPrimary }}>
            {isEmergencyMode ? 'Emergency Mode Active' : 'Emergency Mode'}
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
            {isEmergencyMode ? 'Your spending is restricted to essentials only' : 'Tap SOS to activate survival budget mode'}
          </Text>
        </View>
      </Card>

      {isEmergencyMode && (
        <>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
            <Card style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Daily Limit</Text>
              <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.emergency }}>{formatCurrency(emergencyBudget.dailyLimit)}</Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Essential Budget</Text>
              <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.primary }}>{formatCurrency(emergencyBudget.essentialBudget)}</Text>
            </Card>
          </View>

          {showEmergencySuggestions ? (
            <Card style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md }}>
                <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.primary} />
                <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>Survival Suggestions</Text>
              </View>
              {emergencyBudget.suggestions.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, paddingVertical: 6, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.borderLight }}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                  <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>{s}</Text>
                </View>
              ))}
              <TouchableOpacity
                onPress={() => setShowEmergencySuggestions(false)}
                style={{ alignSelf: 'flex-start', marginTop: Spacing.sm, paddingVertical: Spacing.xs }}
              >
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
                  Hide suggestions
                </Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <Card style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    Need survival suggestions?
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18, marginTop: 2 }}>
                    Show practical steps only when you want guidance.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowEmergencySuggestions(true)}
                  style={{
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.sm,
                    borderRadius: BorderRadius.full,
                    backgroundColor: colors.primaryBg,
                    borderWidth: 1,
                    borderColor: `${colors.primary}30`,
                  }}
                >
                  <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.primary }}>
                    Show
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          <Button title="Deactivate Emergency Mode" onPress={handleToggleEmergencyMode} variant="outline" fullWidth icon="shield-off-outline" />
        </>
      )}
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.base, paddingVertical: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>Savings & Challenges</Text>
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary }}>Predict savings, take challenges, handle emergencies</Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: Spacing.base,
          marginBottom: Spacing.md,
          backgroundColor: colors.surface,
          borderRadius: BorderRadius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}
      >
        {TABS.map((tab, index) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                minHeight: 44,
                paddingVertical: 10,
                paddingHorizontal: 12,
                alignItems: 'center',
                justifyContent: 'center',
                borderRightWidth: index < TABS.length - 1 ? 1 : 0,
                borderRightColor: colors.border,
                backgroundColor: active ? colors.primary : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.xs,
                  fontFamily: Typography.fontFamily.medium,
                  color: active ? colors.textInverse : colors.textSecondary,
                  textAlign: 'center',
                  lineHeight: 16,
                }}
                numberOfLines={1}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: Spacing['2xl'] }} showsVerticalScrollIndicator={false}>
        {activeTab === 'Savings Predictor' && renderSavingsPredictor()}
        {activeTab === 'Challenges' && renderChallenges()}
        {activeTab === 'Emergency' && renderEmergency()}
      </ScrollView>
    </SafeAreaView>
  );
}

