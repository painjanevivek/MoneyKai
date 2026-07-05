import React, { Suspense, lazy, useEffect, useState } from 'react';
import '@/global.css';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, LogBox, Platform } from 'react-native';
import { FontDisplay, useFonts } from 'expo-font';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors, isThemeModeDark, type ColorScheme } from '@/constants/theme';
import { WebsiteSkeleton } from '@/components/skeletons/WebsiteSkeleton';
import { captureSentryException, identifySentryUser } from '@/services/sentry';

const AutoBackupCoordinator = lazy(() =>
  import('@/components/backup/AutoBackupCoordinator').then((module) => ({
    default: module.AutoBackupCoordinator,
  }))
);

const BudgetResetCoordinator = lazy(() =>
  import('@/components/dashboard/BudgetResetCoordinator').then((module) => ({
    default: module.BudgetResetCoordinator,
  }))
);

const AnalyticsRouteTracker = lazy(() =>
  import('@/components/analytics/AnalyticsRouteTracker').then((module) => ({
    default: module.AnalyticsRouteTracker,
  }))
);

const VercelSpeedInsights = lazy(() =>
  import('@/components/analytics/VercelSpeedInsights').then((module) => ({
    default: module.VercelSpeedInsights,
  }))
);

const CookieConsentBanner = lazy(() =>
  import('@/components/privacy/CookieConsentBanner').then((module) => ({
    default: module.CookieConsentBanner,
  }))
);

const appShellRoutePrefixes = [
  '/accounts',
  '/ai-review',
  '/auth',
  '/budgets',
  '/categories',
  '/dashboard',
  '/goals',
  '/groups',
  '/learn-center',
  '/login',
  '/notes',
  '/notifications',
  '/portfolio',
  '/profile-edit',
  '/reports',
  '/savings',
  '/settings',
  '/signup',
  '/subscriptions',
  '/transactions',
  '/wealth',
] as const;

const shouldBlockForAppShellHydration = (pathname: string) =>
  appShellRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const fontWithSwap = (uri: number) => ({
  uri,
  display: FontDisplay.SWAP,
});

const scheduleAfterFirstPaint = (callback: () => void) => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    callback();
    return () => undefined;
  }

  const idleCallback = window.requestIdleCallback;
  if (idleCallback) {
    const handle = idleCallback(callback, { timeout: 2500 });
    return () => window.cancelIdleCallback?.(handle);
  }

  const handle = window.setTimeout(callback, 1200);
  return () => window.clearTimeout(handle);
};

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
  { children: React.ReactNode; colors: ColorScheme },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary] Unhandled render error:', error, info);
    void captureSentryException(error, {
      level: 'fatal',
      tags: {
        boundary: 'root',
        surface: 'expo-web',
      },
      extra: {
        componentStack: info.componentStack,
      },
    });
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

export default function RootLayout() {
  const pathname = usePathname();
  const theme = useSettingsStore((s) => s.theme);
  const darkModeEnabled = useSettingsStore((s) => s.darkModeEnabled);
  const currencyRenderToken = useSettingsStore((s) => `${s.currency}:${s.currencySymbol}:${s.exchangeRatesUpdatedAt ?? ''}`);
  const refreshExchangeRates = useSettingsStore((s) => s.refreshExchangeRates);
  const colors = (Colors[theme] ?? Colors.light) as ColorScheme;
  const isDark = darkModeEnabled || isThemeModeDark(theme);
  const hydrateSession = useAuthStore((s) => s.hydrateSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydratingSession = useAuthStore((s) => s.isHydratingSession);
  const user = useAuthStore((s) => s.user);
  const [nonCriticalUiReady, setNonCriticalUiReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular: fontWithSwap(Poppins_400Regular),
    Poppins_500Medium: fontWithSwap(Poppins_500Medium),
    Poppins_600SemiBold: fontWithSwap(Poppins_600SemiBold),
    Poppins_700Bold: fontWithSwap(Poppins_700Bold),
  });

  useEffect(() => {
    if (__DEV__) {
      void import('@/services/firebase').then(({ isFirebaseConfigured }) => {
        if (!isFirebaseConfigured()) {
          console.warn(
            '[MoneyKai] Firebase is not configured. Configure the EXPO_PUBLIC_FIREBASE_* keys to enable cloud auth and backup.'
          );
        }
      });
    }

    hydrateSession().catch((e) => {
      if (__DEV__) console.warn('[MoneyKai] hydrateSession error:', e);
      void captureSentryException(e, {
        tags: {
          operation: 'hydrateSession',
          surface: 'expo-web',
        },
      });
    });
  }, [hydrateSession]);

  useEffect(() => scheduleAfterFirstPaint(() => setNonCriticalUiReady(true)), []);

  useEffect(() => {
    void identifySentryUser(user);
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void refreshExchangeRates();
  }, [currencyRenderToken, isAuthenticated, refreshExchangeRates]);

  useEffect(() => {
    if (Platform.OS === 'web' || fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') {
      return undefined;
    }

    let uninstall: () => void = () => undefined;
    let mounted = true;

    void import('@/services/notificationService').then(({ initializeNotificationChannel, installNotificationListeners }) => {
      if (!mounted) {
        return;
      }

      void initializeNotificationChannel();
      uninstall = installNotificationListeners((route) => {
        if (route) {
          router.push(route as any);
        }
      });
    });

    return () => {
      mounted = false;
      uninstall();
    };
  }, [isAuthenticated]);

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
  const isServerRender = Platform.OS === 'web' && typeof window === 'undefined';
  const showWebsiteSkeleton =
    !isServerRender && shouldBlockForAppShellHydration(pathname) && isHydratingSession;

  return (
    <AppErrorBoundary colors={colors}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {isAuthenticated ? (
        <Suspense fallback={null}>
          <AutoBackupCoordinator />
          <BudgetResetCoordinator />
        </Suspense>
      ) : null}
      {nonCriticalUiReady ? (
        <Suspense fallback={null}>
          <AnalyticsRouteTracker />
          <VercelSpeedInsights />
        </Suspense>
      ) : null}
      <View key={currencyRenderToken} style={{ flex: 1, backgroundColor: colors.background }}>
        <WebsiteSkeleton loading={showWebsiteSkeleton}>{content}</WebsiteSkeleton>
      </View>
      {nonCriticalUiReady ? (
        <Suspense fallback={null}>
          <CookieConsentBanner />
        </Suspense>
      ) : null}
    </AppErrorBoundary>
  );
}
