import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform, type ColorValue } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Shadows } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionComposerSheet } from '@/components/ui/TransactionComposerSheet';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const TabLabel = ({
  label,
  color,
  focused,
}: {
  label: string;
  color: string | ColorValue;
  focused: boolean;
}) => {
  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(focused ? 1 : 0.78, { duration: 180 }),
      transform: [{ translateY: withTiming(focused ? -1 : 0, { duration: 180 }) }],
    }),
    [focused]
  );

  return (
    <Animated.Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.82}
      style={[
        {
          fontSize: 11,
          lineHeight: 14,
          textAlign: 'center',
          fontFamily: focused ? Typography.fontFamily.semiBold : Typography.fontFamily.medium,
          color,
          width: 104,
        },
        animatedStyle,
      ]}
    >
      {label}
    </Animated.Text>
  );
};

const TabIcon = ({ name, color, focused }: { name: IconName; color: string | ColorValue; focused: boolean }) => {
  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(focused ? 1 : 0.78, { duration: 180 }),
      transform: [{ scale: withTiming(focused ? 1.06 : 1, { duration: 180 }) }],
    }),
    [focused]
  );

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: 30 }}>
      <Animated.View
        style={[
          {
            width: 46,
            height: 30,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: focused ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
            ...(focused ? Shadows.glow(String(color)) : null),
          },
          animatedStyle,
        ]}
      >
        <MaterialCommunityIcons name={name} size={24} color={color} />
      </Animated.View>
    </View>
  );
};

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isComposerVisible, setIsComposerVisible] = React.useState(false);
  const hiddenTabOptions = React.useCallback(
    (title: string) => ({
      href: null,
      title,
      headerShown: false,
      headerShadowVisible: false,
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTitleStyle: {
        color: colors.textPrimary,
        fontFamily: Typography.fontFamily.semiBold,
        fontSize: 16,
      },
      contentStyle: {
        backgroundColor: colors.background,
      },
    }),
    [colors.background, colors.textPrimary]
  );

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          sceneStyle: {
            backgroundColor: colors.background,
          },
          freezeOnBlur: true,
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
            height: 58,
            paddingTop: 4,
            paddingBottom: 4,
            justifyContent: 'center',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: Typography.fontFamily.medium,
            lineHeight: 14,
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
          listeners={{
            tabPress: (event) => {
              event.preventDefault();
              setIsComposerVisible(true);
            },
          }}
          options={{
            title: 'Add',
            tabBarLabel: ({ color, focused }) => <TabLabel label="Add" color={color} focused={focused} />,
            tabBarIcon: ({ color, focused }) => <TabIcon name="plus-circle-outline" color={color} focused={focused} />,
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
          name="more"
          options={{
            title: 'More',
            tabBarLabel: ({ color, focused }) => <TabLabel label="More" color={color} focused={focused} />,
            tabBarIcon: ({ color, focused }) => <TabIcon name="dots-horizontal-circle-outline" color={color} focused={focused} />,
          }}
        />

        <Tabs.Screen name="savings" options={hiddenTabOptions('Savings')} />
        <Tabs.Screen name="groups" options={hiddenTabOptions('Groups')} />
        <Tabs.Screen name="learn-center" options={hiddenTabOptions('Learn Center')} />
        <Tabs.Screen name="settings" options={hiddenTabOptions('Settings')} />
        <Tabs.Screen name="analytics" options={hiddenTabOptions('Analytics')} />
        <Tabs.Screen name="notes" options={hiddenTabOptions('Notes')} />
        <Tabs.Screen name="notifications" options={hiddenTabOptions('Notifications')} />
        <Tabs.Screen name="accounts" options={hiddenTabOptions('Accounts')} />
        <Tabs.Screen name="auto-capture" options={hiddenTabOptions('Transaction Capture')} />
        <Tabs.Screen name="ai-review" options={hiddenTabOptions('AI Review')} />
        <Tabs.Screen name="portfolio" options={hiddenTabOptions('Portfolio')} />
        <Tabs.Screen name="wealth" options={hiddenTabOptions('Wealth')} />
      </Tabs>
      {isComposerVisible ? (
        <TransactionComposerSheet visible onClose={() => setIsComposerVisible(false)} />
      ) : null}
    </>
  );
}
