import React, { useEffect } from 'react';
import { LogBox, StatusBar } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemedAlertProvider } from './src/components/ui/ThemedAlertProvider';
import { Colors, isThemeModeDark } from './src/constants/theme';
import { addSentryBreadcrumb, initMoneyKaiSentry, syncSentryUser } from './src/services/sentry';
import { useAuthStore } from './src/stores/useAuthStore';
import { useSettingsStore } from './src/stores/useSettingsStore';

initMoneyKaiSentry();

if (__DEV__) {
  LogBox.ignoreAllLogs(true);
}

function App() {
  const theme = useSettingsStore((state) => state.theme);
  const darkModeEnabled = useSettingsStore((state) => state.darkModeEnabled);
  const colors = Colors[theme];
  const isDark = darkModeEnabled || isThemeModeDark(theme);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydratingSession = useAuthStore((state) => state.isHydratingSession);

  useEffect(() => {
    syncSentryUser(isAuthenticated ? user : null);
  }, [isAuthenticated, user?.id, user?.auth_provider]);

  useEffect(() => {
    if (!isHydratingSession) {
      addSentryBreadcrumb({
        category: 'app.lifecycle',
        message: 'Initial auth hydration completed',
        level: 'info',
      });
    }
  }, [isHydratingSession]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} translucent={false} />
      <ThemedAlertProvider>
        <RootNavigator />
      </ThemedAlertProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);
