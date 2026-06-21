import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors, isThemeModeDark } from '@/constants/theme';
import { ScreenState } from '@/components/ui/ScreenState';
import type { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { AppTabs } from './AppTabs';
import { ProfileEditScreen } from '@/screens/app/ProfileEditScreen';
import { NotificationsScreen } from '@/screens/app/NotificationsScreen';
import { NotesScreen } from '@/screens/app/NotesScreen';
import { GroupsScreen } from '@/screens/app/GroupsScreen';
import { LearnScreen } from '@/screens/app/LearnScreen';
import { SavingsScreen } from '@/screens/app/SavingsScreen';
import { AiReviewScreen } from '@/screens/app/AiReviewScreen';
import { SettingsScreen } from '@/screens/app/SettingsScreen';
import { AutoCaptureScreen } from '@/screens/app/AutoCaptureScreen';
import { SubscriptionsScreen } from '@/screens/app/SubscriptionsScreen';
import { AutoCaptureCoordinator } from '@/components/capture/AutoCaptureCoordinator';
import { SyncCoordinator } from '@/components/sync/SyncCoordinator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useSettingsStore((state) => state.theme);
  const darkModeEnabled = useSettingsStore((state) => state.darkModeEnabled);
  const colors = Colors[theme];
  const isDark = darkModeEnabled || isThemeModeDark(theme);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydratingSession = useAuthStore((state) => state.isHydratingSession);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  React.useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  if (isHydratingSession) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 }}>
        <ScreenState loading title="Opening MoneyKai" body="Restoring your secure session and parsed SMS workspace." tone="primary" />
      </View>
    );
  }

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      primary: colors.primary,
      text: colors.textPrimary,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary },
          headerShown: false,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'ios_from_right',
          gestureEnabled: true,
          headerBackTitle: 'Back',
          headerTransparent: false,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Group screenOptions={{ headerShown: false }}>
              <Stack.Screen name="App" component={AppTabs} />
            </Stack.Group>
            <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Notes" component={NotesScreen} />
            <Stack.Screen name="Groups" component={GroupsScreen} />
            <Stack.Screen name="Learn" component={LearnScreen} />
            <Stack.Screen name="Savings" component={SavingsScreen} />
            <Stack.Screen name="AiReview" component={AiReviewScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AutoCapture" component={AutoCaptureScreen} />
            <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
      {isAuthenticated && (
        <>
          <SyncCoordinator />
          <AutoCaptureCoordinator />
        </>
      )}
    </NavigationContainer>
  );
}
