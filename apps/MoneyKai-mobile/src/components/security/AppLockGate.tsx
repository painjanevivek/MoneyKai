import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon as MaterialCommunityIcons } from '@/components/ui/AppIcon';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { authenticateDeviceOwner, canAuthenticateDeviceOwner, consumeSplashAppLockResult, isDeviceAuthenticationInProgress, syncSplashAppLockEnabled, wasDeviceOwnerJustVerified } from '@/services/deviceOwnerAuthentication';

type Props = {
  children: React.ReactNode;
};

export function AppLockGate({ children }: Props) {
  const { colors } = useTheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const appLockEnabled = useSettingsStore((state) => state.appLockEnabled);
  const [settingsHydrated, setSettingsHydrated] = useState(useSettingsStore.persist.hasHydrated());
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [hasDeviceAuthentication, setHasDeviceAuthentication] = useState<boolean | null>(null);
  const unlockRequestId = useRef(0);
  const promptInFlight = useRef(false);
  const startupCheckPending = useRef(true);
  const lastAppState = useRef(AppState.currentState);

  useEffect(() => {
    const unsubscribe = useSettingsStore.persist.onFinishHydration(() => setSettingsHydrated(true));
    if (useSettingsStore.persist.hasHydrated()) setSettingsHydrated(true);
    return unsubscribe;
  }, []);

  const promptUnlock = useCallback(async () => {
    if (promptInFlight.current) return;
    if (!isAuthenticated || !appLockEnabled) {
      setIsUnlocked(true);
      return;
    }

    promptInFlight.current = true;
    const requestId = ++unlockRequestId.current;
    setIsUnlocked(false);
    setIsChecking(true);
    setHasAttempted(true);

    try {
      const available = await canAuthenticateDeviceOwner();
      if (unlockRequestId.current === requestId) setHasDeviceAuthentication(available);
      if (available) {
        const verified = await authenticateDeviceOwner('Unlock MoneyKai');
        if (unlockRequestId.current === requestId) setIsUnlocked(verified);
      }
    } catch {
      if (unlockRequestId.current === requestId) setIsUnlocked(false);
    } finally {
      promptInFlight.current = false;
      if (unlockRequestId.current === requestId) {
        setIsChecking(false);
      }
    }
  }, [appLockEnabled, isAuthenticated]);

  useEffect(() => {
    if (!settingsHydrated) return;
    void syncSplashAppLockEnabled(isAuthenticated && appLockEnabled).catch(() => undefined);
  }, [appLockEnabled, isAuthenticated, settingsHydrated]);

  useEffect(() => {
    if (!settingsHydrated || !isAuthenticated || !appLockEnabled) return;
    let cancelled = false;
    void consumeSplashAppLockResult()
      .catch(() => 'none' as const)
      .then((result) => {
        if (cancelled) return;
        startupCheckPending.current = false;
        if (result === 'verified' || wasDeviceOwnerJustVerified()) {
          setHasAttempted(true);
          setIsUnlocked(true);
          return;
        }
        // The native splash has handed off; start the system prompt automatically.
        setTimeout(() => {
          if (!cancelled && AppState.currentState !== 'background' && !wasDeviceOwnerJustVerified()) void promptUnlock();
        }, 150);
      });
    return () => {
      cancelled = true;
    };
  }, [appLockEnabled, isAuthenticated, promptUnlock, settingsHydrated]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasInactive = lastAppState.current !== 'active';
      lastAppState.current = nextState;
      if (!isAuthenticated || !appLockEnabled) {
        return;
      }

      if (nextState !== 'active') {
        if (promptInFlight.current || isDeviceAuthenticationInProgress()) return;
        unlockRequestId.current += 1;
        setIsUnlocked(false);
        setIsChecking(false);
        return;
      }

      if (wasInactive && !startupCheckPending.current && !promptInFlight.current && !wasDeviceOwnerJustVerified()) {
        void promptUnlock();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [appLockEnabled, isAuthenticated, promptUnlock]);

  if (settingsHydrated && (!isAuthenticated || !appLockEnabled || isUnlocked)) {
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
      <View
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: BorderRadius.xl,
          backgroundColor: colors.card,
          padding: Spacing.xl,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.borderLight,
          ...Shadows.lg,
          shadowColor: colors.shadowColor,
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            backgroundColor: colors.primaryBg,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: Spacing.lg,
          }}
        >
          <MaterialCommunityIcons name="shield-lock-outline" size={34} color={colors.primary} />
        </View>
        <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary, textAlign: 'center' }}>
          Unlock MoneyKai
        </Text>
        <Text style={{ marginTop: 8, fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary, textAlign: 'center' }}>
          Your app lock is enabled. Use your device biometrics or passcode to continue.
        </Text>

        {hasDeviceAuthentication === false && (
          <View style={{ marginTop: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg, width: '100%' }}>
            <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary, textAlign: 'center' }}>
              Set up a screen lock or biometric authentication in your device settings to use App lock.
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => void promptUnlock()}
          disabled={isChecking || !hasAttempted}
          style={{
            marginTop: Spacing.xl,
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: BorderRadius.full,
            backgroundColor: colors.primary,
            minWidth: 180,
            alignItems: 'center',
            opacity: isChecking || !hasAttempted ? 0.72 : 1,
          }}
        >
          {isChecking || !hasAttempted ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={{ color: colors.textInverse, fontFamily: Typography.fontFamily.semiBold }}>
              Try Again
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
