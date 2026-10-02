import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { HomeSidebarToggle } from '@/components/dashboard/HomeSidebarToggle';
import { SmsSidebarMenu } from '@/components/dashboard/SmsSidebarMenu';
import { Spacing, Typography } from '@/constants/theme';
import { useAppMotion } from '@/hooks/useAppMotion';
import { useTheme } from '@/hooks/useTheme';
import type { HomeMode } from '@/stores/useHomeModeStore';
import { isHomeDrawerSwipe } from '@/utils/homeDrawerGesture';

type Props = {
  open: boolean;
  mode: HomeMode;
  onClose: () => void;
  onSelectMode: (mode: HomeMode) => void;
  onOpenTool: (tool: 'SmsParser' | 'ReviewDrafts' | 'BeforeYouBuy' | 'ArchiveTransactions') => void;
};

const MODES: { mode: HomeMode; title: string; description: string; icon: string }[] = [
  { mode: 'basic', title: 'Basic mode', description: 'Home, Add and Profile', icon: 'view-list-outline' },
  { mode: 'advanced', title: 'Advanced mode', description: 'All tabs and a Home graph', icon: 'view-dashboard-outline' },
];

export function HomeModeDrawer({ open, mode, onClose, onSelectMode, onOpenTool }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { duration } = useAppMotion();
  const drawerWidth = Math.min(width * 0.84, 340);
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !open) setMounted(false);
    });
    return () => animation.stop();
  }, [duration, mounted, open, progress]);

  const closeSwipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => isHomeDrawerSwipe(gesture.dx, gesture.dy, 'close', 16),
    onPanResponderRelease: (_, gesture) => {
      if (isHomeDrawerSwipe(gesture.dx, gesture.dy, 'close', 64)) onClose();
    },
  }), [onClose]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-drawerWidth, 0] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Animated.View pointerEvents="none" style={{ backgroundColor: colors.overlay, opacity, position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        <Pressable accessibilityLabel="Close Home menu" accessibilityRole="button" onPress={onClose} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        <Animated.View
          accessibilityViewIsModal
          {...closeSwipe.panHandlers}
          style={{ backgroundColor: colors.background, borderRightColor: colors.borderLight, borderRightWidth: 1, height: '100%', transform: [{ translateX }], width: drawerWidth }}
        >
          <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.sm }}>
              <HomeSidebarToggle expanded onPress={onClose} />
              <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg }}>MoneyKai</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
            <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, marginTop: Spacing.xl, marginBottom: Spacing.sm }}>Money tools</Text>
            {([
              { route: 'BeforeYouBuy', title: 'Before You Buy', description: 'See the impact before spending', icon: 'cart-outline' },
            ] as const).map((tool) => (
              <PressableScale key={tool.route} accessibilityRole="button" accessibilityLabel={tool.title} onPress={() => { onClose(); onOpenTool(tool.route); }} style={{ minHeight: 64, paddingVertical: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <AppIcon name={tool.icon} color={colors.textPrimary} size={22} />
                <View style={{ flex: 1 }}><Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md }}>{tool.title}</Text><Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.md, lineHeight: 20 }}>{tool.description}</Text></View>
                <AppIcon name="chevron-right" color={colors.textTertiary} size={20} />
              </PressableScale>
            ))}
            <SmsSidebarMenu onOpen={(route) => { onClose(); onOpenTool(route); }} />
            <View style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }}>
              <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.lg }}>Dashboard mode</Text>
              <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, lineHeight: Typography.lineHeight.md, marginTop: Spacing.sm }}>
                Choose Home detail and which tabs stay visible.
              </Text>
            </View>

            {MODES.map((option) => {
              const selected = mode === option.mode;
              return (
                <PressableScale
                  key={option.mode}
                  accessibilityRole="radio"
                  accessibilityLabel={option.title}
                  accessibilityState={{ checked: selected }}
                  onPress={() => onSelectMode(option.mode)}
                  style={{ alignItems: 'center', backgroundColor: selected ? colors.primaryBg : colors.background, borderColor: colors.borderLight, borderBottomWidth: 1, flexDirection: 'row', gap: Spacing.md, minHeight: 64, paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm }}
                >
                  <AppIcon color={colors.textPrimary} name={option.icon} size={24} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md }}>{option.title}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 18, marginTop: Spacing.xs }}>{option.description}</Text>
                  </View>
                  {selected ? <AppIcon color={colors.textPrimary} name="check" size={21} /> : null}
                </PressableScale>
              );
            })}
            <Text style={{ color: colors.textTertiary, fontSize: Typography.fontSize.sm, lineHeight: 18, marginTop: Spacing.md }}>
              In Basic mode, View all opens Activity and Add → Split a bill opens Groups. Your records stay available.
            </Text>
            <PressableScale accessibilityRole="button" accessibilityLabel="Archive Transactions" onPress={() => { onClose(); onOpenTool('ArchiveTransactions'); }} style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
              <AppIcon name="archive-outline" color={colors.textPrimary} size={22} /><Text style={{ color: colors.textPrimary, flex: 1 }}>Archive Transactions</Text><AppIcon name="chevron-right" color={colors.textTertiary} size={20} />
            </PressableScale>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
