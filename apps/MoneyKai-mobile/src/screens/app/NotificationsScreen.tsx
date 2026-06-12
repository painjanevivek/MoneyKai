import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import { createAppScreenStyles, formatDate } from './screenStyles';

export function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const clearNotifications = useNotificationStore((state) => state.clearNotifications);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Notifications</Text>
          <Text style={styles.title}>{unreadCount} unread</Text>
          <Text style={styles.subtitle}>Budget alerts, backups, transaction drafts, and app events.</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.base }}>
          <Button title="Mark Read" onPress={markAllRead} variant="secondary" style={{ flex: 1 }} />
          <Button title="Clear" onPress={clearNotifications} variant="outline" style={{ flex: 1 }} />
        </View>

        {notifications.length === 0 ? (
          <View style={styles.panel}>
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        ) : (
          notifications.map((item) => (
            <View key={item.id} style={styles.panel}>
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
                <View style={{ flex: 1 }}>
                  <Text style={styles.value}>{item.title}</Text>
                  <Text style={styles.muted}>{item.body}</Text>
                  <Text style={{ ...styles.muted, marginTop: 4 }}>{formatDate(item.createdAt)}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
