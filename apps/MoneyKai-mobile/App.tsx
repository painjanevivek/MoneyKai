import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { addSentryBreadcrumb, initMoneyKaiSentry, syncSentryUser } from './src/services/sentry';
import { useAuthStore } from './src/stores/useAuthStore';

initMoneyKaiSentry();

function App() {
  const colorScheme = useColorScheme();
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
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);
