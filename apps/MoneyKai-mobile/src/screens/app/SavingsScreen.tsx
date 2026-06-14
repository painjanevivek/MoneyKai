import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import { CHALLENGE_TEMPLATES, type ChallengeTemplate } from '@/types/challenge';
import { createAppScreenStyles, formatDate } from './screenStyles';

const addDays = (days: number) => {
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
};

export function SavingsScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const currencySymbol = useSettingsStore((state) => state.currencySymbol);
  const challenges = useChallengeStore((state) => state.challenges);
  const totalXP = useChallengeStore((state) => state.totalXP);
  const startChallenge = useChallengeStore((state) => state.startChallenge);
  const updateStreak = useChallengeStore((state) => state.updateStreak);
  const completeChallenge = useChallengeStore((state) => state.completeChallenge);
  const deactivateChallenge = useChallengeStore((state) => state.deactivateChallenge);
  const activeChallenges = challenges.filter((item) => item.status === 'active');
  const completedChallenges = challenges.filter((item) => item.status === 'completed');
  const totalSavings = challenges.reduce((sum, item) => sum + item.savings_earned, 0);

  const formatMoney = (value: number) => `${currencySymbol}${value.toLocaleString('en-IN')}`;

  const startTemplate = (template: ChallengeTemplate) => {
    startChallenge({
      name: template.name,
      category: template.category,
      description: template.description,
      duration_days: template.defaultDuration,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: addDays(template.defaultDuration),
    });
  };

  const complete = (id: string, savings: number) => {
    Alert.alert('Complete challenge?', 'This marks the challenge as completed and records the estimated savings.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: () => completeChallenge(id, 100, savings) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Savings</Text>
          <Text style={styles.title}>Challenges</Text>
          <Text style={styles.subtitle}>Build streaks, reduce spending, and keep savings tied to your account.</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.row}>
            <View>
              <Text style={styles.muted}>Savings earned</Text>
              <Text style={styles.value}>{formatMoney(totalSavings)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.muted}>XP</Text>
              <Text style={styles.value}>{totalXP}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Active</Text>
        {activeChallenges.length === 0 ? (
          <View style={styles.panel}>
            <Text style={styles.emptyText}>No active challenges yet. Start one below when you want a little pressure in the helpful direction.</Text>
          </View>
        ) : (
          activeChallenges.map((item) => (
            <View key={item.id} style={styles.panel}>
              <View style={styles.row}>
                <View style={{ flex: 1, paddingRight: Spacing.md }}>
                  <Text style={styles.value}>{item.name}</Text>
                  <Text style={styles.muted}>
                    {item.current_streak}/{item.duration_days} days · ends {formatDate(item.end_date)}
                  </Text>
                </View>
                <MaterialCommunityIcons name="fire" size={24} color={colors.primary} />
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
                <Button title="+1 Day" onPress={() => updateStreak(item.id)} variant="secondary" size="sm" style={{ flex: 1 }} />
                <Button title="Complete" onPress={() => complete(item.id, 500)} size="sm" style={{ flex: 1 }} />
                <TouchableOpacity
                  onPress={() => deactivateChallenge(item.id)}
                  style={{ alignItems: 'center', justifyContent: 'center', minWidth: 42 }}
                >
                  <MaterialCommunityIcons name="pause-circle-outline" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Start a challenge</Text>
        {CHALLENGE_TEMPLATES.slice(0, 8).map((template) => (
          <View key={template.id} style={styles.panel}>
            <View style={styles.row}>
              <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center', paddingRight: Spacing.md }}>
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: colors.primaryBg,
                    borderRadius: 18,
                    height: 36,
                    justifyContent: 'center',
                    marginRight: Spacing.md,
                    width: 36,
                  }}
                >
                  <MaterialCommunityIcons name={template.icon} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.value}>{template.name}</Text>
                  <Text style={styles.muted}>
                    {template.defaultDuration} days · saves about {formatMoney(template.estimatedSavings)}
                  </Text>
                </View>
              </View>
              <Button title="Start" onPress={() => startTemplate(template)} size="sm" variant="secondary" />
            </View>
          </View>
        ))}

        {completedChallenges.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Completed</Text>
            {completedChallenges.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.panel}>
                <View style={styles.row}>
                  <View>
                    <Text style={styles.value}>{item.name}</Text>
                    <Text style={styles.muted}>{formatMoney(item.savings_earned)} saved</Text>
                  </View>
                  <MaterialCommunityIcons name="check-circle-outline" size={24} color={colors.primary} />
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
