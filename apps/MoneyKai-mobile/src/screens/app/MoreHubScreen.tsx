import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { Disclosure } from '@/components/ui/Disclosure';
import { PressableScale } from '@/components/ui/PressableScale';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGroupStore } from '@/stores/useGroupStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import type { AppTabParamList, RootStackParamList } from '@/navigation/types';
import { createAppScreenStyles } from './screenStyles';

type MoreNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'More'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Destination = 'Account' | 'Groups' | 'TrustCenter' | 'Settings' | 'Notifications';

const PRIMARY_DESTINATIONS: Array<{ body: string; icon: string; route: Destination; title: string }> = [
  { title: 'Shared expenses', body: 'Groups, balances, and settlements', icon: 'account-group-outline', route: 'Groups' },
  { title: 'Trust Center', body: 'Privacy, permissions, and data controls', icon: 'shield-check-outline', route: 'TrustCenter' },
  { title: 'Settings', body: 'Sync, backup, security, and preferences', icon: 'settings', route: 'Settings' },
];

export function MoreHubScreen() {
  const navigation = useNavigation<MoreNavigation>();
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const groupsCount = useGroupStore((state) => state.groups.filter((group) => !group.archived).length);

  const destination = (title: string, body: string, icon: string, route: Destination, badge?: string) => (
    <PressableScale
      accessibilityLabel={`Open ${title}`}
      accessibilityRole="button"
      onPress={() => navigation.navigate(route)}
      style={{ alignItems: 'center', borderBottomColor: colors.borderLight, borderBottomWidth: 1, flexDirection: 'row', gap: Spacing.md, minHeight: 72, paddingVertical: Spacing.md }}
    >
      <View style={{ alignItems: 'center', backgroundColor: colors.primaryBg, borderRadius: BorderRadius.md, height: 44, justifyContent: 'center', width: 44 }}>
        <AppIcon color={colors.primary} name={icon} size={21} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.value}>{title}</Text>
        <Text numberOfLines={2} style={[styles.muted, { marginTop: 2 }]}>{body}</Text>
      </View>
      {badge ? <Text style={{ color: colors.primary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs }}>{badge}</Text> : null}
      <AppIcon color={colors.textTertiary} name="chevron-right" size={20} />
    </PressableScale>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Your MoneyKai</Text>
          <Text style={styles.subtitle}>Account, shared expenses, and controls—without the feature wall.</Text>
        </View>

        <PressableScale
          accessibilityLabel="Open account"
          accessibilityRole="button"
          onPress={() => navigation.navigate('Account')}
          style={{ alignItems: 'center', backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: BorderRadius.lg, borderWidth: 1, flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.base, minHeight: 80, padding: Spacing.base }}
        >
          <UserAvatar name={user?.full_name} email={user?.email} avatarUrl={user?.avatar_url} size={48} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={styles.value}>{user?.full_name || 'Your account'}</Text>
            <Text numberOfLines={1} style={styles.muted}>{user?.email || 'Review account details'}</Text>
          </View>
          <AppIcon color={colors.textTertiary} name="chevron-right" size={22} />
        </PressableScale>

        <View style={styles.panel}>
          {PRIMARY_DESTINATIONS.map((item) => destination(item.title, item.body, item.icon, item.route, item.route === 'Groups' && groupsCount > 0 ? String(groupsCount) : undefined))}
          <Disclosure title="Updates and support" summary="Notifications and product help">
            {destination('Notifications', 'Sync notices and account updates', 'bell-outline', 'Notifications', unreadCount > 0 ? String(unreadCount) : undefined)}
            <Text style={[styles.muted, { paddingVertical: Spacing.md }]}>Help articles and direct support escalation will live here as support operations mature.</Text>
          </Disclosure>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
