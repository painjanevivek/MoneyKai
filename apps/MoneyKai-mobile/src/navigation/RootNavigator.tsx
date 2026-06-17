import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors } from '@/constants/theme';
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
import { AutoCaptureCoordinator } from '@/components/capture/AutoCaptureCoordinator';
import { SyncCoordinator } from '@/components/sync/SyncCoordinator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useSettingsStore((state) => state.theme);
  const colors = Colors[theme];
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydratingSession = useAuthStore((state) => state.isHydratingSession);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  React.useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  if (isHydratingSession) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 }}>
        <ScreenState loading title="Opening MoneyKai" body="Restoring your secure session and local budget data." tone="primary" />
      </View>
    );
  }

  const navigationTheme = {
    ...(theme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
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
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'ios_from_right',
          gestureEnabled: true,
          headerBackTitle: 'Back',
          headerLargeTitle: true,
          headerTransparent: false,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Group screenOptions={{ headerShown: false }}>
              <Stack.Screen name="App" component={AppTabs} />
            </Stack.Group>
            <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ title: 'Profile' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
            <Stack.Screen name="Notes" component={NotesScreen} options={{ title: 'Notes' }} />
            <Stack.Screen name="Groups" component={GroupsScreen} options={{ title: 'Groups' }} />
            <Stack.Screen name="Learn" component={LearnScreen} options={{ title: 'MoneyKai Learn' }} />
            <Stack.Screen name="Savings" component={SavingsScreen} options={{ title: 'Savings' }} />
            <Stack.Screen name="AiReview" component={AiReviewScreen} options={{ title: 'AI Review' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
            <Stack.Screen name="AutoCapture" component={AutoCaptureScreen} options={{ title: 'Auto Capture' }} />
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
