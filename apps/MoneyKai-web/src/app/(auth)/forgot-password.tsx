import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Typography, Spacing } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { consumeAuthAttempt } from '@/services/authRateLimit';
import { trackUserEvent } from '@/services/analytics';
import { requestPasswordResetGateway } from '@/services/authGateway';
import { withAlpha } from '@/utils/glassStyle';

export default function ForgotPasswordScreen() {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBackToLogin = () => {
    router.replace('/login');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    handleBackToLogin();
  };

  const handleReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      trackUserEvent('auth_password_reset_submitted', { surface: 'forgot_password' });
      await consumeAuthAttempt('password-reset', normalizedEmail);
      await requestPasswordResetGateway(normalizedEmail);
      setSentEmail(normalizedEmail);
      setSent(true);
      trackUserEvent('auth_password_reset_succeeded', { surface: 'forgot_password' });
    } catch (err) {
      if (isPasswordResetEnumerationError(err)) {
        setSentEmail(normalizedEmail);
        setSent(true);
        trackUserEvent('auth_password_reset_succeeded', {
          surface: 'forgot_password',
          enumeration_safe: true,
        });
        return;
      }

      trackUserEvent('auth_password_reset_failed', { surface: 'forgot_password' });
      Alert.alert('Reset Failed', getPasswordResetErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, overflow: 'hidden' }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -180,
          right: -110,
          width: 360,
          height: 360,
          borderRadius: 999,
          backgroundColor: withAlpha(colors.primary, isDark ? 0.14 : 0.1),
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -160,
          left: -110,
          width: 320,
          height: 320,
          borderRadius: 999,
          backgroundColor: withAlpha(colors.accent, isDark ? 0.16 : 0.1),
        }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: Spacing.xl,
            paddingVertical: Spacing['2xl'],
          }}
        >
          <View nativeID="main-content" role="main" style={{ alignSelf: 'center', width: '100%', maxWidth: 480 }}>
            <TouchableOpacity onPress={handleBack} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: Spacing.lg }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <Card padding="xl" borderRadius="xl" tone={sent ? 'success' : 'primary'}>
              {!sent ? (
                <>
                  <View style={{
                    width: 64, height: 64, borderRadius: 32,
                    backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.14),
                    alignItems: 'center', justifyContent: 'center',
                    alignSelf: 'center', marginBottom: Spacing.lg,
                    borderWidth: 1,
                    borderColor: withAlpha(colors.primary, 0.34),
                  }}>
                    <MaterialCommunityIcons name="lock-reset" size={32} color={colors.primary} />
                  </View>
                  <Text style={{
                    fontSize: Typography.fontSize.xl,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: colors.textPrimary,
                    textAlign: 'center',
                    marginBottom: Spacing.sm,
                  }}>Forgot Password?</Text>
                  <Text style={{
                    fontSize: Typography.fontSize.sm,
                    fontFamily: Typography.fontFamily.regular,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    marginBottom: Spacing.xl,
                    lineHeight: 22,
                  }}>No worries! Enter your email and we&apos;ll send you a link to reset your password.</Text>
                  <Input
                    label="Email"
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    icon="email-outline"
                    testID="forgot-password-email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Button title="Send Reset Link" onPress={handleReset} fullWidth size="lg" loading={isLoading} testID="forgot-password-submit" />

                </>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
                  <View style={{
                    width: 80, height: 80, borderRadius: 40,
                    backgroundColor: withAlpha(colors.success, isDark ? 0.18 : 0.14),
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: Spacing.lg,
                    borderWidth: 1,
                    borderColor: withAlpha(colors.success, 0.34),
                  }}>
                    <MaterialCommunityIcons name="email-check-outline" size={40} color={colors.primary} />
                  </View>
                  <Text style={{
                    fontSize: Typography.fontSize.xl,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: colors.textPrimary,
                    textAlign: 'center',
                    marginBottom: Spacing.sm,
                  }}>Check your email</Text>
                  <Text style={{
                    fontSize: Typography.fontSize.sm,
                    fontFamily: Typography.fontFamily.regular,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    lineHeight: 22,
                  }}>If a MoneyKai account can receive resets, a link will be sent to {sentEmail}</Text>
                  <Button
                    title="Back to Login"
                    onPress={handleBackToLogin}
                    variant="secondary"
                    style={{ marginTop: Spacing.xl }}
                  />
                </View>
              )}
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getFirebaseAuthErrorCode = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code ?? '');
  }

  return '';
};

const isPasswordResetEnumerationError = (error: unknown) => {
  const code = getFirebaseAuthErrorCode(error);
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return code.includes('user-not-found') || message.includes('user-not-found');
};

const getPasswordResetErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : '';
  if (message.toLowerCase().includes('too many password reset attempts')) {
    return message;
  }

  return 'Could not send the reset link right now. Please wait a moment and try again.';
};

