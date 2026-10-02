import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { useTheme } from '@/hooks/useTheme';
import { useAppMotion } from '@/hooks/useAppMotion';
import { useCaptureStore } from '@/stores/useCaptureStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';

export const SMS_MENU_ITEMS = [
  { route: 'SmsParser', title: 'SMS parser', icon: 'message-processing-outline' },
  { route: 'ReviewDrafts', title: 'Review drafts', icon: 'file-document-edit-outline' },
] as const;

export function SmsSidebarMenu({ onOpen }: { onOpen: (route: typeof SMS_MENU_ITEMS[number]['route']) => void }) {
  const { colors } = useTheme();
  const { duration } = useAppMotion();
  const owner = useAuthStore((state) => state.user?.id);
  const pendingCount = useCaptureStore((state) => state.drafts.filter((draft) => draft.user_id === owner && draft.status === 'pending').length);
  const [expanded, setExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentStyle = useAnimatedStyle(() => ({
    height: withTiming(expanded ? contentHeight : 0, { duration, easing: Easing.out(Easing.cubic) }),
    opacity: withTiming(expanded ? 1 : 0, { duration }),
  }), [expanded, contentHeight, duration]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(expanded ? '180deg' : '0deg', { duration }) }],
  }), [expanded, duration]);

  return <View>
    <PressableScale accessibilityRole="button" accessibilityLabel="SMS" accessibilityHint="Expand or collapse SMS parser and Review drafts" accessibilityState={{ expanded }} onPress={() => setExpanded((value) => !value)} style={styles.trigger}>
      <AppIcon name="message-text-outline" color={colors.textPrimary} size={22} />
      <View style={styles.label}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>SMS</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>Parser and transaction drafts</Text>
      </View>
      <Animated.View style={chevronStyle}><AppIcon name="chevron-down" color={colors.textTertiary} size={20} /></Animated.View>
    </PressableScale>
    <Animated.View style={[styles.clip, contentStyle]} pointerEvents={expanded ? 'auto' : 'none'} accessibilityElementsHidden={!expanded} importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}>
      <View style={[styles.children, { borderLeftColor: colors.border }]} onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}>
        {SMS_MENU_ITEMS.map((item) => <PressableScale key={item.route} accessibilityRole="button" accessibilityLabel={item.route === 'ReviewDrafts' ? `${item.title}, ${pendingCount} pending` : item.title} onPress={() => onOpen(item.route)} style={[styles.item, { backgroundColor: colors.surfaceElevated }]}>
          <AppIcon name={item.icon} size={18} color={colors.textSecondary} />
          <Text style={[styles.childTitle, { color: colors.textPrimary }]}>{item.title}</Text>
          {item.route === 'ReviewDrafts' && pendingCount > 0 ? <View style={[styles.badge, { backgroundColor: colors.primary }]}><Text style={[styles.count, { color: colors.textInverse }]}>{pendingCount > 99 ? '99+' : pendingCount}</Text></View> : null}
          <AppIcon name="chevron-right" size={16} color={colors.textTertiary} />
        </PressableScale>)}
      </View>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  trigger: { minHeight: 64, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  label: { flex: 1, minWidth: 0 },
  title: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base },
  description: { fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.md },
  clip: { overflow: 'hidden' },
  children: { position: 'absolute', top: 0, left: Spacing.md, right: 0, borderLeftWidth: 1, paddingLeft: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.xs },
  item: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, minHeight: 48, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  childTitle: { flex: 1, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm },
  badge: { minWidth: 22, minHeight: 22, paddingHorizontal: Spacing.xs, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  count: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, fontVariant: ['tabular-nums'] },
});
