import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Text, TouchableOpacity, View } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';

type Props = {
  children: React.ReactNode;
};

export function AppLockGate({ children }: Props) {
  const { colors } = useTheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const appLockEnabled = useSettingsStore((state) => state.appLockEnabled);
  const [isUnlocked, setIsUnlocked] = useState(!appLockEnabled);
  const [isChecking, setIsChecking] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState<boolean | null>(null);
  const unlockRequestId = useRef(0);

  const promptUnlock = useCallback(async () => {
    if (!isAuthenticated || !appLockEnabled) {
      setIsUnlocked(true);
      return;
    }

    const requestId = ++unlockRequestId.current;
    setIsUnlocked(false);
    setIsChecking(true);

    try {
      const biometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });
      const sensorStatus = await biometrics.isSensorAvailable();

      if (unlockRequestId.current === requestId) {
        setHasBiometrics(sensorStatus.available);
      }

      const result = await biometrics.simplePrompt({ promptMessage: 'Unlock MoneyKai' });

      if (unlockRequestId.current === requestId) {
        setIsUnlocked(result.success);
      }
    } finally {
      if (unlockRequestId.current === requestId) {
        setIsChecking(false);
      }
    }
  }, [appLockEnabled, isAuthenticated]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void promptUnlock();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [promptUnlock]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (!isAuthenticated || !appLockEnabled) {
        return;
      }

      if (nextState !== 'active') {
        unlockRequestId.current += 1;
        setIsUnlocked(false);
        setIsChecking(false);
        return;
      }

      void promptUnlock();
    });

    return () => {
      subscription.remove();
    };
  }, [appLockEnabled, isAuthenticated, promptUnlock]);

  if (!isAuthenticated || !appLockEnabled || isUnlocked) {
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

        {hasBiometrics === false && (
          <View style={{ marginTop: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg, width: '100%' }}>
            <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary, textAlign: 'center' }}>
              No biometrics are enrolled on this device yet. Enable fingerprint or face unlock in system settings to use this feature.
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => void promptUnlock()}
          disabled={isChecking}
          style={{
            marginTop: Spacing.xl,
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: BorderRadius.full,
            backgroundColor: colors.primary,
            minWidth: 180,
            alignItems: 'center',
            opacity: isChecking ? 0.72 : 1,
          }}
        >
          {isChecking ? (
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
