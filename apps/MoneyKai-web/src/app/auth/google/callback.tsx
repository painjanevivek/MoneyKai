import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { SeoHead } from '@/components/marketing/SeoHead';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { exchangeGoogleOAuthCodeGateway } from '@/services/authGateway';
import { trackUserEvent } from '@/services/analytics';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';

const normalizeParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const sanitizeReturnPath = (value: string | undefined) => {
  const fallback = '/dashboard';
  const raw = String(value || '').trim();
  if (
    !raw ||
    raw.length > 240 ||
    !raw.startsWith('/') ||
    raw.startsWith('//') ||
    raw.includes('\\') ||
    /[\u0000-\u001F]/.test(raw)
  ) {
    return fallback;
  }

  return raw;
};

export default function GoogleOAuthCallbackScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const finishGoogleSignIn = async () => {
      const code = normalizeParam(params.code);
      const oauthError = normalizeParam(params.error);
      if (oauthError) {
        setError(oauthError);
        trackUserEvent('auth_login_failed', { method: 'google' });
        return;
      }

      if (!code) {
        setError('Google sign-in did not return a usable sign-in code.');
        trackUserEvent('auth_login_failed', { method: 'google' });
        return;
      }

      try {
        const { credentials, returnTo } = await exchangeGoogleOAuthCodeGateway(code);
        if (!mounted) {
          return;
        }

        setUser({
          id: credentials.user.uid,
          email: credentials.user.email ?? '',
          full_name: credentials.user.displayName ?? credentials.user.email ?? 'User',
          avatar_url: credentials.user.photoURL ?? undefined,
          auth_provider: 'google',
        });
        trackUserEvent('auth_login_succeeded', { method: 'google' });

        const { syncRemoteState } = await import('@/services/remoteSync');
        await syncRemoteState();
        router.replace(sanitizeReturnPath(returnTo) as any);
      } catch (err) {
        if (!mounted) {
          return;
        }

        trackUserEvent('auth_login_failed', { method: 'google' });
        setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      }
    };

    void finishGoogleSignIn();

    return () => {
      mounted = false;
    };
  }, [params.code, params.error, setUser]);

  return (
    <>
      <SeoHead
        title="Completing Google sign-in | MoneyKai"
        description="Complete Google sign-in for MoneyKai."
        path="/auth/google/callback"
        robots="noindex,nofollow"
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: Spacing.xl }}>
        <View
          style={{
            width: '100%',
            maxWidth: 440,
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
            borderRadius: BorderRadius.xl,
            borderWidth: 1,
            padding: Spacing['2xl'],
            ...Shadows.lg,
            shadowColor: colors.shadowColor,
          }}
        >
          {error ? (
            <>
              <MaterialCommunityIcons name="alert-circle-outline" size={34} color={colors.error} />
              <Text style={{ marginTop: Spacing.md, color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl, textAlign: 'center' }}>
                Google sign-in failed
              </Text>
              <Text style={{ marginTop: Spacing.sm, color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 22, textAlign: 'center' }}>
                {error}
              </Text>
              <Button title="Back to sign in" onPress={() => router.replace('/login')} style={{ marginTop: Spacing.xl }} />
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: Spacing.lg, color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl, textAlign: 'center' }}>
                Completing Google sign-in
              </Text>
              <Text style={{ marginTop: Spacing.sm, color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: 22, textAlign: 'center' }}>
                MoneyKai is verifying the secure backend session.
              </Text>
            </>
          )}
        </View>
      </View>
    </>
  );
}
