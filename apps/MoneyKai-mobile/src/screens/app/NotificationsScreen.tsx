import React, { useState } from 'react';
import { Alert, FlatList, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon as MaterialCommunityIcons } from '@/components/ui/AppIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Button } from '@/components/ui/Button';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { CenteredPageHeader } from '@/components/ui/CenteredPageHeader';
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
  const markRead = useNotificationStore((state) => state.markRead);
  const clearNotifications = useNotificationStore((state) => state.clearNotifications);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const confirmClear = () => Alert.alert('Clear notifications?', 'This removes the notifications on this device. Your transactions and groups stay unchanged.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Clear', style: 'destructive', onPress: clearNotifications },
  ]);

  const renderNotification = React.useCallback(
    ({ item }: { item: AppNotification }) => (
      <PressableScale accessibilityRole="button" accessibilityLabel={`${item.title}${item.read ? '' : ', unread'}`} accessibilityState={{ expanded: expandedId === item.id }} onPress={() => {
        if (!item.read) markRead(item.id);
        setExpandedId(expandedId === item.id ? null : item.id);
      }} style={styles.panel}>
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
            <MaterialCommunityIcons name={item.icon || 'bell-outline'} size={18} color={item.iconColor || colors.primaryDark} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.value} numberOfLines={expandedId === item.id ? undefined : 1}>{item.title}</Text>
            <Text style={styles.muted} numberOfLines={expandedId === item.id ? undefined : 2}>{item.body}</Text>
            <Text style={{ ...styles.muted, marginTop: 4 }}>{formatDate(item.createdAt)}</Text>
            <Text style={{ ...styles.muted, color: colors.primaryDark, marginTop: 6 }}>{expandedId === item.id ? 'Show less' : 'Read details'}</Text>
          </View>
        </View>
      </PressableScale>
    ),
    [colors.primaryDark, colors.primaryBg, expandedId, markRead, styles]
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
              <CenteredPageHeader title="Notifications" leftAction={<ScreenBackButton compact />} />
              <Text style={styles.subtitle}>{unreadCount > 0 ? `${unreadCount} unread updates` : 'Your updates, all in one place.'}</Text>
            </View>

            {notifications.length > 0 ? <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.base }}>
              <Button disabled={unreadCount === 0} title="Mark read" onPress={markAllRead} variant="secondary" style={{ flex: 1 }} />
              <Button title="Clear" onPress={confirmClear} variant="outline" style={{ flex: 1 }} />
            </View> : null}
          </>
        }
        ListEmptyComponent={
          <View style={styles.panel}>
            <Text style={styles.emptyText}>You're all caught up.</Text>
            <Text style={{ ...styles.muted, textAlign: 'center', marginTop: Spacing.sm }}>New updates will appear here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
