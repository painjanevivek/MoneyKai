import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useBadgeStore } from '@/stores/useBadgeStore';
import { BalanceCards } from '@/components/dashboard/BalanceCards';
import { SpendingPieChart } from '@/components/charts/SpendingPieChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { BudgetHealth } from '@/components/dashboard/BudgetHealth';
import { MonthlyReset } from '@/components/dashboard/MonthlyReset';
import { AIInsights } from '@/components/dashboard/AIInsights';
import { QuickNotes } from '@/components/dashboard/QuickNotes';
import { EmergencyWidget } from '@/components/dashboard/EmergencyWidget';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { CategoryBarChart } from '@/components/charts/CategoryBarChart';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { BADGE_DEFINITIONS } from '@/constants/badges';
import { formatDate } from '@/utils/dateUtils';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const activeChallenges = useChallengeStore((s) => s.getActiveChallenges());
  const { badges } = useBadgeStore();
  const unlockedBadges = badges.filter(b => b.is_unlocked).slice(0, 4);
  const currentMonth = formatDate(new Date(), 'MMMM yyyy');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: Spacing.base,
          paddingVertical: Spacing.md,
        }}>
          <View>
            <Text style={{
              fontSize: Typography.fontSize.xl,
              fontFamily: Typography.fontFamily.bold,
              color: colors.textPrimary,
            }}>Welcome back, {user?.full_name?.split(' ')[0] || 'User'}! 👋</Text>
            <Text style={{
              fontSize: Typography.fontSize.sm,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textSecondary,
            }}>Here&apos;s your financial overview</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: BorderRadius.sm,
              paddingHorizontal: Spacing.md,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}>
              <Text style={{
                fontSize: Typography.fontSize.xs,
                fontFamily: Typography.fontFamily.medium,
                color: colors.textSecondary,
              }}>{currentMonth}</Text>
              <MaterialCommunityIcons name="chevron-down" size={14} color={colors.textTertiary} />
            </View>
            <TouchableOpacity>
              <MaterialCommunityIcons name="bell-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: colors.primary,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{
                fontSize: Typography.fontSize.sm,
                fontFamily: Typography.fontFamily.bold,
                color: '#FFFFFF',
              }}>{user?.full_name?.[0] || 'A'}</Text>
            </View>
          </View>
        </View>

        {/* Balance Cards */}
        <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
          <BalanceCards />
        </View>

        {/* Row: Spending Overview + Recent Transactions */}
        <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
          <SpendingPieChart />
        </View>

        <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
          <RecentTransactions onViewAll={() => router.push('/(tabs)/transactions')} />
        </View>

        {/* Row: Budget Health + Monthly Reset */}
        <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.base }}>
          <View style={{ flex: 1 }}>
            <BudgetHealth />
          </View>
          <View style={{ flex: 1 }}>
            <MonthlyReset />
          </View>
        </View>

        {/* Row: No Spend Challenge + AI Badges + Emergency + AI Insights */}
        <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.base }}>
          {/* No Spend Challenge Card */}
          <View style={{
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: BorderRadius.lg,
            padding: Spacing.base,
            ...Shadows.md,
            shadowColor: colors.shadowColor,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <Text style={{
                fontSize: Typography.fontSize.md,
                fontFamily: Typography.fontFamily.semiBold,
                color: colors.textPrimary,
              }}>No Spend Challenge</Text>
              {activeChallenges.length > 0 && (
                <View style={{
                  backgroundColor: colors.primaryBg,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}>
                  <Text style={{
                    fontSize: 10,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: colors.primary,
                  }}>Active Challenge</Text>
                </View>
              )}
            </View>
            {activeChallenges.length > 0 ? (
              <View>
                <View style={{
                  backgroundColor: colors.primaryBg,
                  borderRadius: BorderRadius.sm,
                  padding: Spacing.md,
                  marginBottom: Spacing.md,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <MaterialCommunityIcons name="food-off" size={18} color={colors.primary} />
                    <Text style={{
                      fontSize: Typography.fontSize.sm,
                      fontFamily: Typography.fontFamily.semiBold,
                      color: colors.textPrimary,
                    }}>{activeChallenges[0].name}</Text>
                  </View>
                  <Text style={{
                    fontSize: Typography.fontSize.xs,
                    fontFamily: Typography.fontFamily.regular,
                    color: colors.textSecondary,
                    marginBottom: 4,
                  }}>{activeChallenges[0].description}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{
                      fontSize: Typography.fontSize.xs,
                      fontFamily: Typography.fontFamily.medium,
                      color: colors.primary,
                    }}>Day {activeChallenges[0].current_streak} / {activeChallenges[0].duration_days}</Text>
                    <Text style={{
                      fontSize: Typography.fontSize.xs,
                      fontFamily: Typography.fontFamily.bold,
                      color: colors.primaryLight,
                    }}>+100 XP</Text>
                  </View>
                  {/* Progress bar */}
                  <View style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: `${colors.primary}20`,
                    marginTop: 8,
                    overflow: 'hidden',
                  }}>
                    <View style={{
                      height: '100%',
                      width: `${(activeChallenges[0].current_streak / activeChallenges[0].duration_days) * 100}%`,
                      borderRadius: 2,
                      backgroundColor: colors.primary,
                    }} />
                  </View>
                </View>
              </View>
            ) : (
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, fontFamily: Typography.fontFamily.regular }}>
                No active challenges. Start one!
              </Text>
            )}
            <TouchableOpacity onPress={() => router.push('/(tabs)/savings')} style={{
              backgroundColor: colors.surface,
              borderRadius: BorderRadius.sm,
              paddingVertical: Spacing.sm,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Text style={{
                fontSize: Typography.fontSize.sm,
                fontFamily: Typography.fontFamily.medium,
                color: colors.primary,
              }}>View Challenges</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Badges Row */}
        <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
          <View style={{
            backgroundColor: colors.card,
            borderRadius: BorderRadius.lg,
            padding: Spacing.base,
            ...Shadows.md,
            shadowColor: colors.shadowColor,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <Text style={{
                fontSize: Typography.fontSize.md,
                fontFamily: Typography.fontFamily.semiBold,
                color: colors.textPrimary,
              }}>AI Badges</Text>
              <TouchableOpacity>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.primary }}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {unlockedBadges.map((badge) => {
                const def = BADGE_DEFINITIONS.find(d => d.id === badge.badge_type);
                return (
                  <View key={badge.id} style={{ alignItems: 'center', width: 70 }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: `${def?.color || colors.primary}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 6,
                      borderWidth: 2,
                      borderColor: `${def?.color || colors.primary}40`,
                    }}>
                      <MaterialCommunityIcons
                        name={(def?.icon || 'medal') as any}
                        size={22}
                        color={def?.color || colors.primary}
                      />
                    </View>
                    <Text style={{
                      fontSize: 9,
                      fontFamily: Typography.fontFamily.semiBold,
                      color: colors.textPrimary,
                      textAlign: 'center',
                    }} numberOfLines={1}>{badge.name}</Text>
                    <Text style={{
                      fontSize: 8,
                      fontFamily: Typography.fontFamily.regular,
                      color: colors.textTertiary,
                      textAlign: 'center',
                    }}>
                      {badge.unlocked_at ? formatDate(badge.unlocked_at, 'dd MMM yyyy') : ''}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Row: Emergency + AI Insights */}
        <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.base }}>
          <View style={{ flex: 1 }}>
            <EmergencyWidget />
          </View>
          <View style={{ flex: 1 }}>
            <AIInsights />
          </View>
        </View>

        {/* Spending Trend Chart */}
        <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
          <TrendLineChart />
        </View>

        {/* Row: Top Categories + Quick Notes */}
        <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.base }}>
          <View style={{ flex: 1 }}>
            <CategoryBarChart />
          </View>
          <View style={{ flex: 1 }}>
            <QuickNotes />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
