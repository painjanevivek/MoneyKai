import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeOverviewScreen } from '@/screens/app/HomeOverviewScreen';
import { TransactionsScreen } from '@/screens/app/TransactionsScreen';
import { AddTransactionScreen } from '@/screens/app/AddTransactionScreen';
import { BudgetScreen } from '@/screens/app/BudgetScreen';
import { MoreHubScreen } from '@/screens/app/MoreHubScreen';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAppMotion } from '@/hooks/useAppMotion';
import { useTheme } from '@/hooks/useTheme';
import type { AppTabParamList } from './types';
import { GlassTabBar } from './GlassTabBar';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function ProductionAppTabs() {
  const { colors } = useTheme();
  const { reduceMotion } = useAppMotion();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        animation: reduceMotion ? 'none' : 'fade',
        freezeOnBlur: true,
        headerShown: false,
        lazy: true,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen name="Home" component={HomeOverviewScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Add" component={AddTransactionScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="More" component={MoreHubScreen} options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined }} />
    </Tab.Navigator>
  );
}

export default ProductionAppTabs;
