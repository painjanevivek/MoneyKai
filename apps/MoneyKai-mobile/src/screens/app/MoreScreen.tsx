import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import type { AppTabParamList, RootStackParamList } from '@/navigation/types';
import { createAppScreenStyles } from './screenStyles';

type MoreNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'More'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type FeatureRoute = Exclude<keyof RootStackParamList, 'Auth' | 'App'>;

interface FeatureItem {
  title: string;
  body: string;
  metric: string;
  icon: string;
  route: FeatureRoute;
  tone: 'primary' | 'accent' | 'warning' | 'danger';
}

export function MoreScreen() {
  const navigation = useNavigation<MoreNavigation>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const notesCount = useNotesStore((state) => state.notes.length);
  const groupsCount = useGroupStore((state) => state.groups.filter((group) => !group.archived).length);
  const activeChallenges = useChallengeStore((state) => state.challenges.filter((item) => item.status === 'active').length);
  const captureSettings = useCaptureStore((state) => state.settings);
  const draftCount = useCaptureStore((state) => state.drafts.filter((draft) => draft.status === 'pending').length);
  const theme = useSettingsStore((state) => state.theme);

  const toneColor = {
    primary: colors.primary,
    accent: colors.textPrimary,
    warning: colors.warning,
    danger: colors.emergency,
  };

  const features: FeatureItem[] = [
    {
      title: 'Savings',
      body: 'Challenges, streaks, and saved-money progress.',
      metric: activeChallenges > 0 ? `${activeChallenges} active` : 'Start a streak',
      icon: 'piggy-bank-outline',
      route: 'Savings',
      tone: 'primary',
    },
    {
      title: 'Groups',
      body: 'Shared spending for trips, rooms, and events.',
      metric: groupsCount > 0 ? `${groupsCount} active` : 'Create group',
      icon: 'account-group-outline',
      route: 'Groups',
      tone: 'accent',
    },
    {
      title: 'MoneyKai Learn',
      body: 'Short guides for budgeting, saving, and calmer money habits.',
      metric: 'Fresh guides',
      icon: 'school-outline',
      route: 'Learn',
      tone: 'accent',
    },
    {
      title: 'Notes',
      body: 'Plans, checklists, and quick money reminders.',
      metric: notesCount > 0 ? `${notesCount} notes` : 'Add note',
      icon: 'notebook-outline',
      route: 'Notes',
      tone: 'warning',
    },
    {
      title: 'Auto Capture',
      body: 'Review transaction drafts captured from signals.',
      metric: draftCount > 0 ? `${draftCount} pending` : captureSettings.autoCaptureEnabled ? 'Enabled' : 'Off',
      icon: 'radar',
      route: 'AutoCapture',
      tone: 'primary',
    },
    {
      title: 'Notifications',
      body: 'Approvals, sync updates, and account alerts.',
      metric: unreadCount > 0 ? `${unreadCount} unread` : 'All clear',
      icon: 'bell-outline',
      route: 'Notifications',
      tone: unreadCount > 0 ? 'danger' : 'accent',
    },
    {
      title: 'Settings',
      body: 'Profile, backup, security, and app preferences.',
      metric: theme === 'dark' ? 'Dark mode' : 'Light mode',
      icon: 'cog-outline',
      route: 'Settings',
      tone: 'primary',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>MoneyKai tools</Text>
          <Text style={styles.title}>Everything in one place</Text>
          <Text style={styles.subtitle}>Open the features that support your daily budget, shared costs, savings, and account safety.</Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          activeOpacity={0.78}
          onPress={() => navigation.navigate('ProfileEdit')}
          style={{
            alignItems: 'center',
            backgroundColor: colors.primary,
            borderRadius: BorderRadius.lg,
            flexDirection: 'row',
            gap: Spacing.md,
            marginBottom: Spacing.base,
            minHeight: 68,
            padding: Spacing.base,
          }}
        >
          <View
            style={{
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              borderRadius: BorderRadius.full,
              height: 44,
              justifyContent: 'center',
              width: 44,
            }}
          >
            <UserAvatar name={user?.full_name} email={user?.email} avatarUrl={user?.avatar_url} size={44} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textInverse, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md }}>
              Profile and identity
            </Text>
            <Text style={{ color: colors.textInverse, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, opacity: 0.82 }}>
              Keep your account details current
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textInverse} />
        </TouchableOpacity>

        <View style={{ gap: Spacing.md }}>
          {features.map((feature) => {
            const featureColor = toneColor[feature.tone];
            return (
              <TouchableOpacity
                key={feature.route}
                accessibilityRole="button"
                accessibilityLabel={`Open ${feature.title}`}
                activeOpacity={0.78}
                onPress={() => navigation.navigate(feature.route)}
                style={{
                  alignItems: 'center',
                  backgroundColor: colors.card,
                  borderColor: colors.borderLight,
                  borderRadius: BorderRadius.lg,
                  borderWidth: 1,
                  flexDirection: 'row',
                  gap: Spacing.md,
                  minHeight: 82,
                  padding: Spacing.base,
                }}
              >
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: colors.primaryBg,
                    borderRadius: BorderRadius.md,
                    height: 48,
                    justifyContent: 'center',
                    width: 48,
                  }}
                >
                  <MaterialCommunityIcons name={feature.icon} size={24} color={featureColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.sm }}>
                    <Text style={styles.value}>{feature.title}</Text>
                    <Text
                      style={{
                        backgroundColor: colors.primaryBg,
                        borderRadius: BorderRadius.full,
                        color: featureColor,
                        fontFamily: Typography.fontFamily.semiBold,
                        fontSize: Typography.fontSize.xs,
                        overflow: 'hidden',
                        paddingHorizontal: Spacing.sm,
                        paddingVertical: 3,
                      }}
                    >
                      {feature.metric}
                    </Text>
                  </View>
                  <Text style={[styles.muted, { marginTop: 3 }]}>{feature.body}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
