import React from 'react';
import { Pressable, useWindowDimensions, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppTabParamList } from './types';
import { useTheme } from '@/hooks/useTheme';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { HomeScreen } from '@/screens/app/HomeScreen';
import { TransactionsScreen } from '@/screens/app/TransactionsScreen';
import { AddTransactionScreen } from '@/screens/app/AddTransactionScreen';
import { BudgetScreen } from '@/screens/app/BudgetScreen';
import { MoreScreen } from '@/screens/app/MoreScreen';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';

const Tab = createBottomTabNavigator<AppTabParamList>();

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AnimatedTabButton({ children, onPress, style, accessibilityState, isAdd = false }: BottomTabBarButtonProps & { isAdd?: boolean }) {
  const scale = useSharedValue(1);
  const focused = Boolean(accessibilityState?.selected);

  const animateTo = (value: number) => {
    scale.value = withSpring(value, {
      damping: 13,
      stiffness: 240,
      mass: 0.7,
    });
  };

  React.useEffect(() => {
    animateTo(focused || isAdd ? 1.04 : 1);
  }, [focused, isAdd]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityState={accessibilityState}
      onPress={(event: GestureResponderEvent) => onPress?.(event)}
      onPressIn={() => animateTo(isAdd ? 1.08 : 0.94)}
      onPressOut={() => animateTo(focused || isAdd ? 1.04 : 1)}
      style={[
        style as StyleProp<ViewStyle>,
        animatedStyle,
        {
          top: isAdd ? -8 : 0,
        },
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function AppTabs() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isWide = width >= 720;

  return (
    <Tab.Navigator
      detachInactiveScreens
      screenOptions={{
        freezeOnBlur: true,
        headerShown: false,
        lazy: true,
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: isWide ? 'beside-icon' : 'below-icon',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: Typography.fontFamily.medium,
          fontSize: Typography.fontSize.xs,
        },
        tabBarStyle: {
          backgroundColor: colors.glassBg,
          borderColor: colors.glassBorder,
          borderWidth: 1,
          borderTopWidth: 1,
          borderRadius: BorderRadius['2xl'],
          height: 68 + Math.max(insets.bottom, Spacing.sm),
          paddingBottom: Math.max(insets.bottom, Spacing.sm),
          paddingTop: Spacing.xs,
          paddingHorizontal: Spacing.xs,
          position: 'absolute',
          left: Spacing.md,
          right: Spacing.md,
          bottom: Math.max(insets.bottom, Spacing.sm),
          ...Shadows.lg,
          shadowColor: colors.shadowColor,
        },
        tabBarItemStyle: {
          borderRadius: BorderRadius.md,
          maxWidth: isWide ? 148 : undefined,
          marginHorizontal: 2,
        },
        tabBarBadgeStyle: {
          backgroundColor: colors.emergency,
          color: colors.textInverse,
          fontFamily: Typography.fontFamily.semiBold,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size} />,
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="swap-horizontal" color={color} size={size} />,
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddTransactionScreen}
        options={{
          title: 'Add',
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="plus"
              color={colors.textInverse}
              size={30}
              style={{
                backgroundColor: focused ? colors.primaryLight : colors.primary,
                borderColor: colors.background,
                borderRadius: 26,
                borderWidth: 4,
                height: 54,
                paddingTop: 8,
                textAlign: 'center',
                width: 54,
              }}
            />
          ),
          tabBarLabelStyle: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs },
          tabBarButton: (props) => <AnimatedTabButton {...props} isAdd />,
        }}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="wallet-outline" color={color} size={size} />,
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          title: 'More',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="dots-grid" color={color} size={size} />,
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
        }}
      />
    </Tab.Navigator>
  );
}
