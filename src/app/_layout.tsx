import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Platform, useWindowDimensions, LogBox } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Colors } from '@/constants/theme';

// Suppress known web warnings from react-native-gifted-charts passing RN props to DOM elements
LogBox.ignoreLogs([
  'Unknown event handler property `onStartShouldSetResponder`',
  'Unknown event handler property `onResponderTerminationRequest`',
  'Unknown event handler property `onResponderGrant`',
  'Unknown event handler property `onResponderRelease`',
  'Unknown event handler property `onResponderTerminate`',
  'Unknown event handler property `onPressOut`',
  'Maximum update depth exceeded', // We fixed this via store memoization, but ignore strict-mode double-renders
]);

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const theme = useSettingsStore((s) => s.theme);
  const colors = Colors[theme];
  const { width } = useWindowDimensions();

  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // On web desktop, center in a phone-like container
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width > 768;
  const containerMaxWidth = isDesktop ? 430 : '100%';

  const content = (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      {isDesktop ? (
        <View style={{
          flex: 1,
          backgroundColor: '#111827',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <View style={{
            width: containerMaxWidth as number,
            height: '100%',
            maxHeight: 900,
            backgroundColor: colors.background,
            borderRadius: isDesktop ? 20 : 0,
            overflow: 'hidden',
            // Phone frame shadow
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 30,
            elevation: 20,
          }}>
            {content}
          </View>
        </View>
      ) : (
        content
      )}
    </>
  );
}
