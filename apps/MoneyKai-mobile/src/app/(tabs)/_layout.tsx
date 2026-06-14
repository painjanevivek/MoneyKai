import React from 'react';
import { Tabs, router } from 'expo-router';
import { View, Platform, TouchableOpacity, type ColorValue } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Typography, Shadows } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TransactionComposerSheet } from '@/components/ui/TransactionComposerSheet';
import { BudgetRequiredDialog } from '@/components/ui/BudgetRequiredDialog';
import { useBudgetStore } from '@/stores/useBudgetStore';

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

const AddTabButton = ({
  backgroundColor,
  foregroundColor,
  borderColor,
  onPress,
}: {
  backgroundColor: string;
  foregroundColor: string;
  borderColor: string;
  onPress: () => void;
}) => (
  <View
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add transaction"
      style={{
        marginTop: -18,
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        borderWidth: 4,
        borderColor,
        ...Shadows.lg,
        shadowColor: backgroundColor,
      }}
    >
      <MaterialCommunityIcons name="plus" size={30} color={foregroundColor} />
    </TouchableOpacity>
  </View>
);

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isComposerVisible, setIsComposerVisible] = React.useState(false);
  const [isBudgetDialogVisible, setIsBudgetDialogVisible] = React.useState(false);
  const monthlyAllowance = useBudgetStore((state) => state.settings.monthly_allowance);
  const addButtonBackground = colors.textPrimary;
  const addButtonForeground = colors.background;
  const requireMonthlyBudget = React.useCallback(() => {
    if (monthlyAllowance > 0) {
      return true;
    }

    setIsBudgetDialogVisible(true);
    return false;
  }, [monthlyAllowance]);

  const handleSetBudget = React.useCallback(() => {
    setIsBudgetDialogVisible(false);
    router.push('/(tabs)/budget');
  }, []);
  const goBackFromHiddenTab = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)');
  }, []);
  const hiddenTabOptions = React.useCallback(
    (title: string) => ({
      href: null,
      title,
      headerShown: true,
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
      headerLeft: () => (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={0.75}
          onPress={goBackFromHiddenTab}
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            marginLeft: Platform.OS === 'ios' ? 4 : 12,
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    }),
    [colors.background, colors.border, colors.card, colors.textPrimary, goBackFromHiddenTab]
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
          options={{
            title: 'Add',
            tabBarButton: () => (
              <AddTabButton
                backgroundColor={addButtonBackground}
                foregroundColor={addButtonForeground}
                borderColor={colors.background}
                onPress={() => {
                  if (requireMonthlyBudget()) {
                    setIsComposerVisible(true);
                  }
                }}
              />
            ),
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

        <Tabs.Screen name="groups" options={hiddenTabOptions('Groups')} />
        <Tabs.Screen name="learn-center" options={hiddenTabOptions('Learn Center')} />
        <Tabs.Screen name="settings" options={hiddenTabOptions('Settings')} />
        <Tabs.Screen name="analytics" options={hiddenTabOptions('Analytics')} />
        <Tabs.Screen name="notes" options={hiddenTabOptions('Notes')} />
        <Tabs.Screen name="notifications" options={hiddenTabOptions('Notifications')} />
        <Tabs.Screen name="auto-capture" options={hiddenTabOptions('Transaction Capture')} />
        <Tabs.Screen name="ai-review" options={hiddenTabOptions('AI Review')} />
        <Tabs.Screen name="portfolio" options={hiddenTabOptions('Portfolio')} />
        <Tabs.Screen name="wealth" options={hiddenTabOptions('Wealth')} />
      </Tabs>
      {isComposerVisible ? (
        <TransactionComposerSheet visible onClose={() => setIsComposerVisible(false)} />
      ) : null}
      <BudgetRequiredDialog
        visible={isBudgetDialogVisible}
        onCancel={() => setIsBudgetDialogVisible(false)}
        onSetBudget={handleSetBudget}
      />
    </>
  );
}
