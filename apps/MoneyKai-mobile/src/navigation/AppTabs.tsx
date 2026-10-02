import React from 'react';
import { Easing } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { AppTabParamList } from './types';
import { useTheme } from '@/hooks/useTheme';
import { OverviewScreen } from '@/screens/app/OverviewScreen';
import { TransactionsScreen } from '@/screens/app/TransactionsScreen';
import { RecordTransactionScreen } from '@/screens/app/RecordTransactionScreen';
import { useAppMotion } from '@/hooks/useAppMotion';
import { SharedLedgerScreen } from '@/screens/app/SharedLedgerScreen';
import { IdentityScreen } from '@/screens/app/IdentityScreen';
import { GlassTabBar } from './GlassTabBar';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  const { colors } = useTheme();
  const { reduceMotion, duration } = useAppMotion();
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      detachInactiveScreens
      backBehavior="history"
      screenOptions={{
        animation: reduceMotion ? 'none' : 'fade',
        transitionSpec: reduceMotion ? undefined : { animation: 'timing', config: { duration, easing: Easing.out(Easing.cubic) } },
        freezeOnBlur: true,
        headerShown: false,
        lazy: true,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tab.Screen name="Home" component={OverviewScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'Activity' }} />
      <Tab.Screen name="Add" component={RecordTransactionScreen} options={{ title: 'Add' }} />
      <Tab.Screen name="Groups" component={SharedLedgerScreen} />
      <Tab.Screen name="Profile" component={IdentityScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
