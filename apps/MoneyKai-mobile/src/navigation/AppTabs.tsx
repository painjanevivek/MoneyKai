import React from 'react';
import { Pressable, useWindowDimensions, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import type { AppTabParamList } from './types';
import { useTheme } from '@/hooks/useTheme';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { HomeScreen } from '@/screens/app/HomeScreen';
import { TransactionsScreen } from '@/screens/app/TransactionsScreen';
import { AddTransactionScreen } from '@/screens/app/AddTransactionScreen';
import { BudgetScreen } from '@/screens/app/BudgetScreen';
import { MoreScreen } from '@/screens/app/MoreScreen';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';

const Tab = createBottomTabNavigator<AppTabParamList>();

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AnimatedTabButton({ children, onPress, style, accessibilityState }: BottomTabBarButtonProps) {
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
    animateTo(focused ? 1.04 : 1);
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityState={accessibilityState}
      onPress={(event: GestureResponderEvent) => onPress?.(event)}
      onPressIn={() => animateTo(0.94)}
      onPressOut={() => animateTo(focused ? 1.04 : 1)}
      style={[style as StyleProp<ViewStyle>, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function AppTabs() {
  const { colors } = useTheme();
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
          backgroundColor: colors.card,
          borderColor: colors.borderLight,
          borderWidth: 0,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: Spacing.md,
          paddingTop: Spacing.xs,
          paddingHorizontal: Spacing.xs,
        },
        tabBarItemStyle: {
          borderRadius: BorderRadius.sm,
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
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="plus-circle-outline" color={color} size={size} />,
          tabBarLabelStyle: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs },
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
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
