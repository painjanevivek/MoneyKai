import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text, TouchableOpacity, ActivityIndicator, LogBox } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors } from '@/constants/theme';
import { isFirebaseConfigured } from '@/services/firebase';
import { initializeNotificationChannel, installNotificationListeners } from '@/services/notificationService';
import { AppLockGate } from '@/components/security/AppLockGate';
import { AutoBackupCoordinator } from '@/components/backup/AutoBackupCoordinator';
import { SyncCoordinator } from '@/components/sync/SyncCoordinator';

// Suppress known web warnings from react-native-gifted-charts passing RN props to DOM elements
LogBox.ignoreLogs([
  'Unknown event handler property `onStartShouldSetResponder`',
  'Unknown event handler property `onResponderTerminationRequest`',
  'Unknown event handler property `onResponderGrant`',
  'Unknown event handler property `onResponderRelease`',
  'Unknown event handler property `onResponderTerminate`',
  'Maximum update depth exceeded',
]);

SplashScreen.preventAutoHideAsync();
WebBrowser.maybeCompleteAuthSession();

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode; colors: typeof Colors.light | typeof Colors.dark },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary] Unhandled render error:', error, info);
  }

  handleRetry = () => this.setState({ hasError: false, error: null });

  render() {
    const { colors } = this.props;
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity
            onPress={this.handleRetry}
            style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}
          >
            <Text style={{ color: colors.textInverse, fontWeight: '600', fontSize: 15 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function NativeNotificationResponseRouter() {
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!lastNotificationResponse) {
      return;
    }

    if (lastNotificationResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      return;
    }

    const route = lastNotificationResponse.notification.request.content.data?.actionRoute;
    if (typeof route === 'string' && route.trim().length > 0) {
      router.push(route as any);
    }

    void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
  }, [lastNotificationResponse]);

  return null;
}

export default function RootLayout() {
  const theme = useSettingsStore((s) => s.theme);
  const colors = Colors[theme];
  const hydrateSession = useAuthStore((s) => s.hydrateSession);
  const isHydratingSession = useAuthStore((s) => s.isHydratingSession);

  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (__DEV__ && !isFirebaseConfigured()) {
        console.warn(
          '[MoneyKai] Firebase is not configured. Configure the EXPO_PUBLIC_FIREBASE_* keys to enable cloud auth and backup.'
        );
      }

      hydrateSession().catch((e) => {
        if (__DEV__) console.warn('[MoneyKai] hydrateSession error:', e);
      });
    }
  }, [fontsLoaded, fontError, hydrateSession]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && !isHydratingSession) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isHydratingSession]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return undefined;
    }

    void initializeNotificationChannel();
    const uninstall = installNotificationListeners((route) => {
      if (route) {
        router.push(route as any);
      }
    });
    return uninstall;
  }, []);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isHydratingSession) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
      <Stack.Screen name="profile-edit" options={{ animation: 'slide_from_right', presentation: 'card' }} />
      <Stack.Screen name="learn" options={{ animation: 'slide_from_right', presentation: 'card' }} />
      <Stack.Screen name="privacy-policy" options={{ animation: 'slide_from_right', presentation: 'card' }} />
      <Stack.Screen name="terms" options={{ animation: 'slide_from_right', presentation: 'card' }} />
      <Stack.Screen name="contact" options={{ animation: 'slide_from_right', presentation: 'card' }} />
    </Stack>
  );

  return (
    <AppErrorBoundary colors={colors}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <AutoBackupCoordinator />
      {Platform.OS !== 'web' ? <NativeNotificationResponseRouter /> : null}
      <SyncCoordinator />
      <AppLockGate>
        <View style={{ flex: 1, backgroundColor: colors.background }}>{content}</View>
      </AppLockGate>
    </AppErrorBoundary>
  );
}

