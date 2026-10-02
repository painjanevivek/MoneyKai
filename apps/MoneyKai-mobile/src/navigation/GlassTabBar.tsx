import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useAppMotion } from '@/hooks/useAppMotion';
import { useHomeModeStore } from '@/stores/useHomeModeStore';
import { getFloatingDockLayout } from '@/utils/floatingDockLayout';
import { PillTab } from './PillTab';
import { getPillGeometry } from './pillGeometry';

const tabs: Record<string, { label: string; icon: string; selectedIcon: string }> = {
  Home: { label: 'Home', icon: 'home-outline', selectedIcon: 'home' },
  Transactions: { label: 'Activity', icon: 'swap-horizontal', selectedIcon: 'swap-horizontal' },
  Add: { label: 'Add', icon: 'plus', selectedIcon: 'plus' },
  Groups: { label: 'Groups', icon: 'account-group-outline', selectedIcon: 'account-group' },
  Profile: { label: 'Profile', icon: 'account-outline', selectedIcon: 'account' },
};

export function GlassTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { width, fontScale } = useWindowDimensions();
  const basicMode = useHomeModeStore((store) => store.mode === 'basic');
  const { largeText, rows, rowGap, tabMinHeight, barPadding, bottomOffset } = getFloatingDockLayout(fontScale, insets.bottom, basicMode);
  const dockWidth = Math.min(width - (largeText ? 24 : 40), basicMode ? 320 : largeText ? 420 : 390);
  const visibleRoutes = state.routes.filter((route) => tabs[route.name] && (!basicMode || (route.name !== 'Transactions' && route.name !== 'Groups')));
  const selectedRouteKey = state.routes[state.index].key;
  const selectedIndex = Math.max(0, visibleRoutes.findIndex(route => route.key === selectedRouteKey));
  const { reduceMotion, duration } = useAppMotion();
  const { inactiveWidth, activeWidth } = getPillGeometry(dockWidth - barPadding * 2, visibleRoutes.length);
  const largeTextWidth = rows > 1 ? (dockWidth - barPadding * 2 - rowGap * 2 - 2) / 3 : (dockWidth - barPadding * 2) / visibleRoutes.length;
  const indicatorIndex = useSharedValue(selectedIndex);
  useEffect(() => {
    indicatorIndex.value = reduceMotion ? selectedIndex : withTiming(selectedIndex, { duration, easing: Easing.out(Easing.cubic) });
    return () => cancelAnimation(indicatorIndex);
  }, [duration, indicatorIndex, reduceMotion, selectedIndex]);
  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: indicatorIndex.value * inactiveWidth }] }));
  const hiddenBasicDestination = basicMode && (state.routes[state.index].name === 'Transactions' || state.routes[state.index].name === 'Groups');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (keyboardVisible || hiddenBasicDestination) return null;
  return (
    <View pointerEvents="box-none" style={[styles.position, { bottom: bottomOffset }]}>
      <View style={[styles.shadow, { width: dockWidth }]}>
        <View accessibilityRole="tablist" style={[styles.bar, { padding: barPadding }, !largeText && { height: tabMinHeight + barPadding * 2 }, rows > 1 ? { flexWrap: 'wrap', justifyContent: 'center', gap: rowGap } : null]}>
          {!largeText ? <Animated.View testID="tab-pill-indicator" pointerEvents="none" accessible={false} style={[styles.indicator, { left: barPadding, top: barPadding, width: activeWidth, height: tabMinHeight }, indicatorStyle]} /> : null}
          {visibleRoutes.map((route, index) => {
            const { label, icon, selectedIcon } = tabs[route.name];
            const selected = selectedRouteKey === route.key;
            const badge = descriptors[route.key].options.tabBarBadge;
            return <PillTab
                  key={route.key}
                  label={label} icon={icon} selectedIcon={selectedIcon}
                  selected={selected} badge={badge}
                  inactiveWidth={largeText ? largeTextWidth : inactiveWidth}
                  activeWidth={largeText ? largeTextWidth : activeWidth}
                  minHeight={tabMinHeight} largeText={largeText}
                  reduceMotion={reduceMotion} duration={duration}
                  slotX={index * inactiveWidth + (index > selectedIndex ? activeWidth - inactiveWidth : 0)}
                  barPadding={barPadding}
                  onPress={() => {
                    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
                  }}
                  onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                />;
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  position: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  shadow: {
    borderRadius: 48,
    shadowColor: Colors.light.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 7,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 48,
    backgroundColor: Colors.light.primary,
    padding: 6,
  },
  indicator: { position: 'absolute', borderRadius: 40, backgroundColor: Colors.light.primaryLight },
});
