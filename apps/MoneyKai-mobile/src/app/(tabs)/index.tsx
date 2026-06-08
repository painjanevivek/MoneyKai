import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useBadgeStore } from '@/stores/useBadgeStore';
import { BalanceCards } from '@/components/dashboard/BalanceCards';
import { SpendingPieChart } from '@/components/charts/SpendingPieChart';
import { QuickNotes } from '@/components/dashboard/QuickNotes';
import { NoteModal } from '@/components/dashboard/NoteModal';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { BADGE_DEFINITIONS } from '@/constants/badges';
import { formatDate, getLastSixMonths } from '@/utils/dateUtils';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { FirstLoginTour } from '@/components/onboarding/FirstLoginTour';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const isHydratingSession = useAuthStore((s) => s.isHydratingSession);
  const signOut = useAuthStore((s) => s.signOut);
  const tourCompleted = useSettingsStore((s) => s.tourCompleted);
  const tourCompletedByUserId = useSettingsStore((s) => s.tourCompletedByUserId);
  const setTourCompletedForUser = useSettingsStore((s) => s.setTourCompletedForUser);
  const activeChallenges = useChallengeStore((s) => s.getActiveChallenges());
  const { badges } = useBadgeStore();
  const unlockedBadges = badges.filter((b) => b.is_unlocked).slice(0, 4);
  const months = useMemo(() => getLastSixMonths(), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState(months[months.length - 1]?.key ?? '');
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const tourCompletedForUser = user?.id ? (tourCompletedByUserId[user.id] ?? tourCompleted) : false;
  const showTour = Boolean(user?.id && !isHydratingSession && !tourCompletedForUser);

  const selectedMonthLabel = months.find((month) => month.key === selectedMonthKey)?.label ?? months[months.length - 1]?.label ?? '';

  const openProfileSettings = () => {
    setShowProfileMenu(false);
    router.push('/(tabs)/settings');
  };

  const handleSignOut = async () => {
    setShowProfileMenu(false);
    await signOut();
    router.replace('/login');
  };

  const completeTour = () => {
    if (user?.id) {
      setTourCompletedForUser(user.id, true);
    }
  };

  const monthTiles = (
    <View style={{ gap: Spacing.sm }}>
      {months.map((month) => {
        const active = month.key === selectedMonthKey;
        return (
          <TouchableOpacity
            key={month.key}
            onPress={() => {
              setSelectedMonthKey(month.key);
              setShowMonthMenu(false);
            }}
            style={{
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.md,
              borderWidth: 1,
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? colors.primaryBg : colors.surface,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: active ? colors.primary : colors.textPrimary }}>
              {month.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        <View style={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                MoneyKai
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary, marginTop: 2 }}>
                {selectedMonthLabel}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <TouchableOpacity
                onPress={() => setShowMonthMenu(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: BorderRadius.md,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: 10,
                }}
              >
                <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.textPrimary} />
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
                  Month
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/notifications' as any)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <MaterialCommunityIcons name="bell-outline" size={20} color={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowProfileMenu(true)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...Shadows.sm,
                  shadowColor: colors.primary,
                }}
              >
                <UserAvatar
                  name={user?.full_name}
                  email={user?.email}
                  avatarUrl={user?.avatar_url}
                  size={40}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
          <BalanceCards />
        </View>

        <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
          <SpendingPieChart />
        </View>

        <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.lg }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: BorderRadius.lg,
              padding: Spacing.base,
              ...Shadows.md,
              shadowColor: colors.shadowColor,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Active Challenge
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/savings')}>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.primary }}>View</Text>
              </TouchableOpacity>
            </View>
            {activeChallenges.length > 0 ? (
              <View
                style={{
                  backgroundColor: colors.primaryBg,
                  borderRadius: BorderRadius.md,
                  padding: Spacing.md,
                  borderWidth: 1,
                  borderColor: `${colors.primary}20`,
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {activeChallenges[0].name}
                </Text>
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary, marginTop: 4 }}>
                  Day {activeChallenges[0].current_streak} of {activeChallenges[0].duration_days}
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
                No active challenge. Start one from Savings.
              </Text>
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
          <QuickNotes
            onViewAll={() => router.push('/(tabs)/notes' as any)}
            onNewNote={() => setShowNoteModal(true)}
          />
        </View>

        {unlockedBadges.length > 0 && (
          <View style={{ paddingHorizontal: Spacing.base, marginBottom: Spacing.base }}>
            <View style={{
              backgroundColor: colors.card,
              borderRadius: BorderRadius.lg,
              padding: Spacing.base,
              ...Shadows.md,
              shadowColor: colors.shadowColor,
            }}>
              <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.md }}>
                Recent Badges
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' }}>
                {unlockedBadges.map((badge) => {
                  const def = BADGE_DEFINITIONS.find((entry) => entry.id === badge.badge_type);
                  return (
                    <View key={badge.id} style={{ alignItems: 'center', width: 72 }}>
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: `${def?.color || colors.primary}15`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 6,
                        borderWidth: 1,
                        borderColor: `${def?.color || colors.primary}30`,
                      }}>
                        <MaterialCommunityIcons name={(def?.icon || 'medal') as any} size={22} color={def?.color || colors.primary} />
                      </View>
                      <Text style={{ fontSize: 9, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, textAlign: 'center' }} numberOfLines={1}>
                        {badge.name}
                      </Text>
                      <Text style={{ fontSize: 8, fontFamily: Typography.fontFamily.regular, color: colors.textTertiary, textAlign: 'center' }}>
                        {badge.unlocked_at ? formatDate(badge.unlocked_at, 'dd MMM') : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <NoteModal visible={showNoteModal} onClose={() => setShowNoteModal(false)} />

      <FirstLoginTour
        key={`${user?.id ?? 'guest'}-${showTour ? 'open' : 'closed'}`}
        visible={showTour}
        onFinish={completeTour}
        onSkip={completeTour}
      />

      <ModalSheet
        visible={showMonthMenu}
        title="Select Month"
        subtitle="Choose from the last six months."
        onClose={() => setShowMonthMenu(false)}
      >
        {monthTiles}
      </ModalSheet>

      <ModalSheet
        visible={showProfileMenu}
        title="Account"
        subtitle={user?.email || 'Signed in user'}
        onClose={() => setShowProfileMenu(false)}
      >
        <View style={{ gap: Spacing.sm }}>
          <TouchableOpacity
            onPress={openProfileSettings}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: Spacing.md,
              borderRadius: BorderRadius.md,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <MaterialCommunityIcons name="cog-outline" size={18} color={colors.textPrimary} />
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
              Settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: Spacing.md,
              borderRadius: BorderRadius.md,
              backgroundColor: colors.emergencyBg,
              borderWidth: 1,
              borderColor: `${colors.emergency}30`,
            }}
          >
            <MaterialCommunityIcons name="logout" size={18} color={colors.emergency} />
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: colors.emergency }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}

