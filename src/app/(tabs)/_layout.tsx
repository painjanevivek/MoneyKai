import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform, Text, type ColorValue } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Shadows } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const TabLabel = ({
  label,
  color,
  focused,
}: {
  label: string;
  color: string | ColorValue;
  focused: boolean;
}) => (
  <Text
    numberOfLines={2}
    style={{
      fontSize: 10,
      lineHeight: 12,
      textAlign: 'center',
      fontFamily: Typography.fontFamily.medium,
      color,
      opacity: focused ? 1 : 0.88,
      maxWidth: 72,
    }}
  >
    {label}
  </Text>
);

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
          height: Platform.OS === 'ios' ? 100 : 88,
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) + 10 : 14,
          paddingTop: 8,
          ...Shadows.sm,
          shadowColor: colors.shadowColor,
        },
        tabBarItemStyle: {
          minWidth: 0,
          paddingTop: 2,
          paddingBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: Typography.fontFamily.medium,
          lineHeight: 12,
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: ({ color, focused }) => <TabLabel label="Dashboard" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon name="view-dashboard-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarLabel: ({ color, focused }) => <TabLabel label="Transactions" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon name="swap-horizontal" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarLabel: ({ color, focused }) => <TabLabel label="Groups" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon name="account-group-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          title: 'Savings',
          tabBarLabel: ({ color, focused }) => <TabLabel label="Savings" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon name="piggy-bank-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarLabel: ({ color, focused }) => <TabLabel label="Analytics" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon name="chart-bar" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: ({ color, focused }) => <TabLabel label="Settings" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon name="cog-outline" color={color} focused={focused} />,
        }}
      />
      {/* ── Screens navigated to programmatically; hidden from tab bar ── */}
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          href: null, // hidden from tab bar
          tabBarLabel: ({ color, focused }) => <TabLabel label="Notes" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon name="note-text-outline" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          href: null, // hidden from tab bar
          tabBarLabel: ({ color, focused }) => <TabLabel label="Notifications" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon name="bell-outline" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
