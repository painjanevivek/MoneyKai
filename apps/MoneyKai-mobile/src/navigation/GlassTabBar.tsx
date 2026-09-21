import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppIcon } from '@/components/ui/AppIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { PRIMARY_TABS } from '@/components/ui/uiContracts';
import { BorderRadius, ComponentTokens, Layout, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAppMotion } from '@/hooks/useAppMotion';
import { useTheme } from '@/hooks/useTheme';

const TAB_CONFIG = Object.fromEntries(PRIMARY_TABS.map((tab) => [tab.route, tab])) as Record<
  string,
  (typeof PRIMARY_TABS)[number]
>;

export function GlassTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { duration, reduceMotion } = useAppMotion();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const visibleRoutes = useMemo(() => state.routes.filter((route) => TAB_CONFIG[route.name]), [state.routes]);
  const activeRouteKey = state.routes[state.index]?.key;
  const selectedIndex = visibleRoutes.findIndex((route) => route.key === activeRouteKey);
  const dockWidth = Math.min(Math.max(width - Spacing.xl, 300), Layout.maxContentWidth);
  const horizontalPadding = Spacing.xs;
  const itemGap = 2;
  const tabWidth = (dockWidth - horizontalPadding * 2 - itemGap * (visibleRoutes.length - 1)) / visibleRoutes.length;

  const selectionStyle = useAnimatedStyle(
    () => ({
      opacity: selectedIndex < 0 ? 0 : 1,
      transform: [
        {
          translateX: withTiming(Math.max(selectedIndex, 0) * (tabWidth + itemGap), {
            duration,
            easing: Easing.out(Easing.cubic),
          }),
        },
      ],
    }),
    [duration, selectedIndex, tabWidth]
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardVisible) return null;

  return (
    <View pointerEvents="box-none" style={[styles.position, { bottom: Math.max(insets.bottom, Spacing.sm) }]}>
      <View
        style={[
          styles.dock,
          {
            backgroundColor: colors.glassBg,
            borderColor: colors.glassBorder,
            shadowColor: colors.shadowColor,
            width: dockWidth,
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.selection,
            { backgroundColor: colors.surfaceSupport, width: tabWidth },
            selectionStyle,
          ]}
        />
        <View accessibilityRole="tablist" style={[styles.row, { gap: itemGap, paddingHorizontal: horizontalPadding }]}>
          {visibleRoutes.map((route) => {
            const tab = TAB_CONFIG[route.name];
            const selected = route.key === activeRouteKey;
            const badge = descriptors[route.key]?.options.tabBarBadge;
            const isAdd = route.name === 'Add';
            const badgeLabel = typeof badge === 'number' || typeof badge === 'string' ? `, ${badge} unread` : '';

            return (
              <PressableScale
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={`${tab.label}${badgeLabel}`}
                accessibilityState={{ selected }}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                onPress={() => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
                }}
                pressedScale={reduceMotion ? 1 : ComponentTokens.pressedScale}
                style={[styles.tab, { width: tabWidth }]}
                testID={`primary-tab-${route.name.toLowerCase()}`}
              >
                <View style={[styles.iconBox, isAdd && { backgroundColor: colors.action }]}>
                  <AppIcon
                    name={tab.icon}
                    size={isAdd ? 22 : 20}
                    color={selected || isAdd ? colors.textPrimary : colors.textSecondary}
                  />
                  {badge ? <View style={[styles.badge, { backgroundColor: colors.error }]} /> : null}
                </View>
                <Text
                  maxFontSizeMultiplier={2}
                  numberOfLines={2}
                  style={[
                    styles.label,
                    { color: selected ? colors.textPrimary : colors.textSecondary },
                    selected && styles.selectedLabel,
                  ]}
                >
                  {tab.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  position: { alignItems: 'center', left: 0, position: 'absolute', right: 0 },
  dock: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    minHeight: Layout.tabBarHeight,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  row: { alignItems: 'stretch', flexDirection: 'row', paddingVertical: Spacing.xs },
  selection: {
    borderRadius: BorderRadius.xl,
    bottom: Spacing.xs,
    left: Spacing.xs,
    position: 'absolute',
    top: Spacing.xs,
  },
  tab: {
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    gap: 1,
    justifyContent: 'center',
    minHeight: ComponentTokens.controlHeight.lg,
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  label: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  selectedLabel: { fontFamily: Typography.fontFamily.semiBold },
  badge: { borderRadius: 3, height: 6, position: 'absolute', right: 0, top: 0, width: 6 },
});

export default GlassTabBar;
