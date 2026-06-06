import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform, type ColorValue } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Shadows } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const TabIcon = ({ name, color, focused }: { name: IconName; color: string | ColorValue; focused: boolean }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <MaterialCommunityIcons name={name} size={24} color={color} />
    {focused && (
      <View style={{
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: color,
        marginTop: 4,
      }} />
    )}
  </View>
);

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          height: Platform.OS === 'ios' ? 92 : 78,
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 10) + 10 : 12,
          paddingTop: 10,
          ...Shadows.sm,
          shadowColor: colors.shadowColor,
        },
        tabBarItemStyle: {
          paddingTop: 4,
          paddingBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: Typography.fontFamily.medium,
          lineHeight: 13,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <TabIcon name="view-dashboard-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, focused }) => <TabIcon name="swap-horizontal" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, focused }) => <TabIcon name="account-group-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          title: 'Savings',
          tabBarIcon: ({ color, focused }) => <TabIcon name="piggy-bank-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => <TabIcon name="chart-bar" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => <TabIcon name="cog-outline" color={color} focused={focused} />,
        }}
      />
      {/* ── Screens navigated to programmatically; hidden from tab bar ── */}
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          href: null, // hidden from tab bar
          tabBarIcon: ({ color, focused }) => <TabIcon name="note-text-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          href: null, // hidden from tab bar
          tabBarIcon: ({ color, focused }) => <TabIcon name="bell-outline" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
