import React from 'react';
import { Tabs, router } from 'expo-router';
import { View, Platform, Text, TouchableOpacity, type ColorValue } from 'react-native';
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
    numberOfLines={1}
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
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: color,
          marginTop: 4,
        }}
      />
    )}
  </View>
);

const AddTabButton = ({ color }: { color: string }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={() => router.push({ pathname: '/(tabs)/transactions', params: { compose: '1' } })}
    accessibilityRole="button"
    accessibilityLabel="Add transaction"
    style={{
      marginTop: -18,
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color,
      borderWidth: 4,
      borderColor: '#FFFFFF',
      ...Shadows.lg,
      shadowColor: color,
    }}
  >
    <MaterialCommunityIcons name="plus" size={30} color="#FFFFFF" />
  </TouchableOpacity>
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
          title: 'Home',
          tabBarLabel: ({ color, focused }) => <TabLabel label="Home" color={color} focused={focused} />,
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
        name="add"
        options={{
          title: 'Add',
          tabBarButton: () => <AddTabButton color={colors.primary} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarLabel: ({ color, focused }) => <TabLabel label="Budget" color={color} focused={focused} />,
          tabBarIcon: ({ color, focused }) => <TabIcon name="wallet-outline" color={color} focused={focused} />,
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

      <Tabs.Screen name="groups" options={{ href: null }} />
      <Tabs.Screen name="learn-center" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="notes" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
