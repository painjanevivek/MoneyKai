import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import { createAppScreenStyles, formatDate } from './screenStyles';
import type { AppNotification } from '@/types/notification';

export function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const clearNotifications = useNotificationStore((state) => state.clearNotifications);

  const renderNotification = React.useCallback(
    ({ item }: { item: AppNotification }) => (
      <View style={styles.panel}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              alignItems: 'center',
              backgroundColor: item.iconBg || colors.primaryBg,
              borderRadius: 18,
              height: 36,
              justifyContent: 'center',
              marginRight: Spacing.md,
              width: 36,
            }}
          >
            <MaterialCommunityIcons name={item.icon || 'bell-outline'} size={18} color={item.iconColor || colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.value} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.muted} numberOfLines={2}>{item.body}</Text>
            <Text style={{ ...styles.muted, marginTop: 4 }}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </View>
    ),
    [colors.primary, colors.primaryBg, styles]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <ScreenBackButton />
              <Text style={styles.title}>Notifications</Text>
              <Text style={styles.subtitle}>{unreadCount} unread alerts, capture drafts, backups, and app events.</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.base }}>
              <Button title="Mark read" onPress={markAllRead} variant="secondary" style={{ flex: 1 }} />
              <Button title="Clear" onPress={clearNotifications} variant="outline" style={{ flex: 1 }} />
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.panel}>
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
