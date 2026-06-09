import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { EmptyState } from '@/components/ui/EmptyState';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const iconByType: Record<string, string> = {
  budget: 'wallet-outline',
  transaction: 'cash-plus',
  challenge: 'trophy-outline',
  backup: 'cloud-check-outline',
  system: 'bell-outline',
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: Spacing.base, paddingVertical: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
          Notifications
        </Text>
        <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
          {notificationsEnabled ? 'Recent activity and alerts' : 'Notifications are disabled'}
        </Text>
      </View>

      {!notificationsEnabled ? (
        <EmptyState
          icon="bell-off-outline"
          title="Notifications off"
          message="Enable notifications in Settings to receive spending alerts and reminders."
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="bell-outline"
          title="No notifications yet"
          message="You will see budget alerts, backups, and challenge updates here."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: Spacing['2xl'] }}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((notification, index) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => {
                if (notification.actionRoute) {
                  router.push(notification.actionRoute as any);
                }
              }}
              style={{
                backgroundColor: colors.card,
                borderRadius: BorderRadius.lg,
                padding: Spacing.base,
                marginBottom: Spacing.md,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: Spacing.md,
                ...Shadows.sm,
                shadowColor: colors.shadowColor,
                borderLeftWidth: 3,
                borderLeftColor: index === 0 ? colors.primary : 'transparent',
              }}
            >
              <View style={{
                width: 42,
                height: 42,
                borderRadius: BorderRadius.sm,
                backgroundColor: notification.iconBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MaterialCommunityIcons
                  name={(notification.icon || iconByType[notification.type] || 'bell-outline') as any}
                  size={20}
                  color={notification.iconColor}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: 4 }}>
                  {notification.title}
                </Text>
                <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 18 }}>
                  {notification.body}
                </Text>
                <Text style={{ fontSize: 10, color: colors.textTertiary, marginTop: 6 }}>
                  {new Date(notification.createdAt).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
