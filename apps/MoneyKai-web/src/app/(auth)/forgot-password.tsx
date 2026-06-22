import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Typography, Spacing } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firebaseAuth, isFirebaseConfigured } from '@/services/firebase';
import { withAlpha } from '@/utils/glassStyle';

export default function ForgotPasswordScreen() {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
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
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!isFirebaseConfigured()) {
      Alert.alert(
        'Demo Mode',
        'Password reset emails require Firebase to be configured.\n\nFill in the EXPO_PUBLIC_FIREBASE_* values in your .env file.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      setSent(true);
    } catch (err) {
      Alert.alert(
        'Reset Failed',
        err instanceof Error ? err.message : 'Could not send the reset link. Please try again.'
      );
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
                  }}>We&apos;ve sent a password reset link to {email}</Text>
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

