import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui/PressableScale';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useNotesStore } from '@/stores/useNotesStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
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
  const { colors, isDark } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const notesCount = useNotesStore((state) => state.notes.length);
  const groupsCount = useGroupStore((state) => state.groups.filter((group) => !group.archived).length);
  const activeChallenges = useChallengeStore((state) => state.challenges.filter((item) => item.status === 'active').length);
  const captureSettings = useCaptureStore((state) => state.settings);
  const draftCount = useCaptureStore((state) => state.drafts.filter((draft) => draft.status === 'pending').length);
  const openMoneyKaiPlus = () => navigation.navigate('Subscriptions');

  const toneColor = {
    primary: colors.primary,
    accent: colors.textPrimary,
    warning: colors.warning,
    danger: colors.emergency,
  };

  const features: FeatureItem[] = [
    {
      title: 'Savings',
      body: 'Challenges and streaks linked to reviewed records.',
      metric: activeChallenges > 0 ? `${activeChallenges} active` : 'Start a streak',
      icon: 'piggy-bank-outline',
      route: 'Savings',
      tone: 'primary',
    },
    {
      title: 'Groups',
      body: 'Shared expenses for trips, rooms, and events.',
      metric: groupsCount > 0 ? `${groupsCount} active` : 'Create group',
      icon: 'account-group-outline',
      route: 'Groups',
      tone: 'accent',
    },
    {
      title: 'MoneyKai Learn',
      body: 'Short guides for SMS review, budgets, and saving.',
      metric: 'Fresh guides',
      icon: 'school-outline',
      route: 'Learn',
      tone: 'accent',
    },
    {
      title: 'Notes',
      body: 'Plans, checklists, and quick reminders.',
      metric: notesCount > 0 ? `${notesCount} notes` : 'Add note',
      icon: 'notebook-outline',
      route: 'Notes',
      tone: 'warning',
    },
    {
      title: 'Auto Capture',
      body: 'Review drafts from SMS and notification capture.',
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
      title: 'AI Review',
      body: 'Test configured models and check attachment analysis readiness.',
      metric: 'DeepSeek, Kimi, Gemma',
      icon: 'brain',
      route: 'AiReview',
      tone: 'primary',
    },
    {
      title: 'Settings',
      body: 'Backup, security, sync, and app preferences.',
      metric: isDark ? 'Dark mode' : 'Light mode',
      icon: 'cog-outline',
      route: 'Settings',
      tone: 'primary',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>More tools</Text>
          <Text style={styles.subtitle}>Open SMS capture, review helpers, shared expenses, savings, notes, and account settings.</Text>
        </View>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Open MoneyKai Plus premium membership"
          onPress={openMoneyKaiPlus}
          style={{
            backgroundColor: 'rgba(245, 197, 90, 0.14)',
            borderColor: 'rgba(245, 197, 90, 0.42)',
            borderRadius: BorderRadius.lg,
            borderWidth: 1,
            marginBottom: Spacing.base,
            minHeight: 92,
            padding: Spacing.base,
          }}
        >
          <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.md }}>
            <View
              style={{
                alignItems: 'center',
                backgroundColor: 'rgba(245, 197, 90, 0.18)',
                borderColor: 'rgba(245, 197, 90, 0.36)',
                borderRadius: BorderRadius.md,
                borderWidth: 1,
                height: 48,
                justifyContent: 'center',
                width: 48,
              }}
            >
              <MaterialCommunityIcons name="crown-outline" size={24} color="#F5C55A" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.sm }}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: '#F5C55A',
                    flex: 1,
                    fontFamily: Typography.fontFamily.bold,
                    fontSize: Typography.fontSize.lg,
                  }}
                >
                  MoneyKai+
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    backgroundColor: 'rgba(245, 197, 90, 0.14)',
                    borderColor: 'rgba(245, 197, 90, 0.34)',
                    borderRadius: BorderRadius.full,
                    borderWidth: 1,
                    color: '#FFE6A6',
                    fontFamily: Typography.fontFamily.semiBold,
                    fontSize: Typography.fontSize.xs,
                    overflow: 'hidden',
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 4,
                  }}
                >
                  Premium
                </Text>
              </View>
              <Text numberOfLines={2} style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 20, marginTop: 4 }}>
                Expanded AI review, more report context, and priority feature access.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#FFE6A6" />
          </View>
        </PressableScale>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Open profile"
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
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ color: colors.textInverse, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md }}>
              Profile
            </Text>
            <Text numberOfLines={1} style={{ color: colors.textInverse, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, opacity: 0.82 }}>
              Keep your account details current
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textInverse} />
        </PressableScale>

        <View style={{ gap: Spacing.md }}>
          {features.map((feature, index) => {
            const featureColor = toneColor[feature.tone];
            return (
              <Animated.View
                key={feature.route}
                entering={FadeInDown.delay(index * 28).duration(220)}
                layout={Layout.springify()}
              >
                <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Open ${feature.title}`}
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
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.sm }}>
                    <Text style={[styles.value, { flex: 1 }]} numberOfLines={1}>{feature.title}</Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        backgroundColor: colors.primaryBg,
                        borderRadius: BorderRadius.full,
                        color: featureColor,
                        fontFamily: Typography.fontFamily.semiBold,
                        fontSize: Typography.fontSize.xs,
                        maxWidth: 112,
                        overflow: 'hidden',
                        paddingHorizontal: Spacing.sm,
                        paddingVertical: 3,
                      }}
                    >
                      {feature.metric}
                    </Text>
                  </View>
                  <Text style={[styles.muted, { marginTop: 3 }]} numberOfLines={2}>{feature.body}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
                </PressableScale>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
