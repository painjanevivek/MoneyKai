import React from 'react';
import { BackHandler, Platform, ToastAndroid, View } from 'react-native';
import { createNavigationContainerRef, NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@/stores/useAuthStore';
import { Colors } from '@/constants/theme';
import { useAppMotion } from '@/hooks/useAppMotion';
import { BudgetScreen } from '@/screens/app/BudgetScreen';
import { ScreenState } from '@/components/ui/ScreenState';
import type { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { AppTabs } from './AppTabs';
import { ProfileEditScreen } from '@/screens/app/ProfileEditScreen';
import { NotificationsScreen } from '@/screens/app/NotificationsScreen';
import { NotesScreen } from '@/screens/app/NotesScreen';
import { GroupsHubScreen } from '@/screens/app/GroupsHubScreen';
import { LearnScreen } from '@/screens/app/LearnScreen';
import { SavingsScreen } from '@/screens/app/SavingsScreen';
import { AiReviewScreen } from '@/screens/app/AiReviewScreen';
import { SettingsScreen } from '@/screens/app/SettingsScreen';
import { AutoCaptureScreen } from '@/screens/app/AutoCaptureScreen';
import { SmsParserScreen } from '@/screens/app/SmsParserScreen';
import { ReviewDraftsScreen } from '@/screens/app/ReviewDraftsScreen';
import { ArchiveTransactionsScreen } from '@/screens/app/ArchiveTransactionsScreen';
import { PhoneSetupScreen } from '@/screens/auth/PhoneSetupScreen';
import { useTransactionPreferencesStore } from '@/stores/useTransactionPreferencesStore';
import { validLocalPhone } from '@/utils/transactionPreferences';
import { BeforeYouBuyScreen } from '@/screens/app/BeforeYouBuyScreen';
import { LegalScreen } from '@/screens/app/LegalScreen';
import { SubscriptionsScreen } from '@/screens/app/SubscriptionsScreen';
import { TrustCenterScreen } from '@/screens/app/TrustCenterScreen';
import { PrivacySecurityScreen } from '@/screens/app/PrivacySecurityScreen';
import { GraphInsightsScreen } from '@/screens/app/GraphInsightsScreen';
import { GraphTransactionsScreen } from '@/screens/app/GraphTransactionsScreen';
import { AutoCaptureCoordinator } from '@/components/capture/AutoCaptureCoordinator';
import { SyncCoordinator } from '@/components/sync/SyncCoordinator';
import { TrustSetupScreen } from '@/screens/auth/TrustSetupScreen';
import { AppLockGate } from '@/components/security/AppLockGate';
import { NotFoundScreen } from '@/screens/NotFoundScreen';
import { linking } from './linking';
import { TransactionNotificationCoordinator } from '@/components/capture/TransactionNotificationCoordinator';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();
const DOUBLE_BACK_EXIT_WINDOW_MS = 2_000;

export function RootNavigator() {
  const colors = Colors.light;
  const { reduceMotion } = useAppMotion();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isOnboarded = useAuthStore((state) => state.isOnboarded);
  const onboardedUserId = useAuthStore((state) => state.onboardedUserId);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const phone = useTransactionPreferencesStore(state => userId ? state.phones[userId] : undefined);
  const [preferencesReady, setPreferencesReady] = React.useState(useTransactionPreferencesStore.persist.hasHydrated());
  React.useEffect(() => {
    const unsubscribe = useTransactionPreferencesStore.persist.onFinishHydration(() => setPreferencesReady(true));
    if (useTransactionPreferencesStore.persist.hasHydrated()) setPreferencesReady(true);
    return unsubscribe;
  }, []);
  const isHydratingSession = useAuthStore((state) => state.isHydratingSession);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const lastRootBackPressAt = React.useRef(0);
  const [navigationReady, setNavigationReady] = React.useState(0);
  const canNavigateNotification = React.useCallback(() => navigationRef.isReady(), []);
  const openNotificationRoute = React.useCallback((route: 'ReviewDrafts' | 'Transactions') => {
    if (!navigationRef.isReady()) return;
    if (route === 'Transactions') navigationRef.navigate('App', { screen: 'Transactions' });
    else navigationRef.navigate('ReviewDrafts');
  }, []);

  React.useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        return false;
      }

      const now = Date.now();
      if (now - lastRootBackPressAt.current <= DOUBLE_BACK_EXIT_WINDOW_MS) {
        BackHandler.exitApp();
        return true;
      }

      lastRootBackPressAt.current = now;
      ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
      return true;
    });

    return () => subscription.remove();
  }, []);

  if (isHydratingSession) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 }}>
        <ScreenState loading title="Opening MoneyKai" body="Getting your account and latest records ready." tone="primary" />
      </View>
    );
  }

  if (isAuthenticated && !preferencesReady) {
    return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 }}><ScreenState title="Opening private preferences" body="Waiting for encrypted device storage." actionLabel="Retry" onAction={() => void useTransactionPreferencesStore.persist.rehydrate()} /></View>;
  }
  if (isAuthenticated && !validLocalPhone(phone)) return <AppLockGate><PhoneSetupScreen key={userId} /></AppLockGate>;

  if (isAuthenticated && (!isOnboarded || onboardedUserId !== userId)) {
    return <TrustSetupScreen />;
  }

  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.card,
      primary: colors.primary,
      text: colors.textPrimary,
      border: colors.border,
    },
  };

  const appNavigation = (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      linking={linking}
      onReady={() => setNavigationReady(value => value + 1)}
      onStateChange={() => {
        lastRootBackPressAt.current = 0;
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { color: colors.textPrimary },
          headerShown: false,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
          animation: reduceMotion ? 'none' : 'slide_from_right',
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
            <Stack.Screen name="Budget" component={BudgetScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Notes" component={NotesScreen} />
            <Stack.Screen name="Groups" component={GroupsHubScreen} />
            <Stack.Screen name="Learn" component={LearnScreen} />
            <Stack.Screen name="Savings" component={SavingsScreen} />
            <Stack.Screen name="AiReview" component={AiReviewScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AutoCapture" component={AutoCaptureScreen} />
            <Stack.Screen name="SmsParser" component={SmsParserScreen} />
            <Stack.Screen name="ReviewDrafts" component={ReviewDraftsScreen} />
            <Stack.Screen name="ArchiveTransactions" component={ArchiveTransactionsScreen} />
            <Stack.Screen name="BeforeYouBuy" component={BeforeYouBuyScreen} />
            <Stack.Screen name="Legal" component={LegalScreen} />
            <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
            <Stack.Screen name="TrustCenter" component={TrustCenterScreen} />
            <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
            <Stack.Screen name="GraphInsights" component={GraphInsightsScreen} />
            <Stack.Screen name="GraphTransactions" component={GraphTransactionsScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
        )}
        <Stack.Screen name="NotFound" component={NotFoundScreen} />
      </Stack.Navigator>
      {isAuthenticated && (
        <>
          <SyncCoordinator />
          <AutoCaptureCoordinator />
          {navigationReady > 0 && <TransactionNotificationCoordinator key={navigationReady} navigate={openNotificationRoute} canNavigate={canNavigateNotification} />}
        </>
      )}
    </NavigationContainer>
  );
  return isAuthenticated ? <AppLockGate>{appNavigation}</AppLockGate> : appNavigation;
}
