import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors } from '@/constants/theme';
import type { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { AppTabs } from './AppTabs';
import { ProfileEditScreen } from '@/screens/app/ProfileEditScreen';
import { NotificationsScreen } from '@/screens/app/NotificationsScreen';
import { NotesScreen } from '@/screens/app/NotesScreen';
import { GroupsScreen } from '@/screens/app/GroupsScreen';
import { SettingsScreen } from '@/screens/app/SettingsScreen';
import { AutoCaptureScreen } from '@/screens/app/AutoCaptureScreen';

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="App" component={AppTabs} />
            <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Notes" component={NotesScreen} />
            <Stack.Screen name="Groups" component={GroupsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AutoCapture" component={AutoCaptureScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
