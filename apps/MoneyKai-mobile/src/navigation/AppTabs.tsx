import React from 'react';
import { Animated, Pressable, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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

function AnimatedTabButton({ children, onPress, style, accessibilityState, isAdd = false }: BottomTabBarButtonProps & { isAdd?: boolean }) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const focused = Boolean(accessibilityState?.selected);

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      friction: 5,
      tension: 180,
    }).start();
  };

  return (
    <AnimatedPressable
      accessibilityState={accessibilityState}
      onPress={(event: GestureResponderEvent) => onPress?.(event)}
      onPressIn={() => animateTo(isAdd ? 1.08 : 0.94)}
      onPressOut={() => animateTo(focused || isAdd ? 1.04 : 1)}
      style={[
        style as StyleProp<ViewStyle>,
        {
          transform: [{ scale }],
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
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: Typography.fontFamily.medium,
          fontSize: Typography.fontSize.xs,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          borderTopWidth: 1,
          minHeight: 72,
          paddingBottom: Spacing.sm,
          paddingTop: Spacing.xs,
        },
        tabBarItemStyle: {
          borderRadius: BorderRadius.md,
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
