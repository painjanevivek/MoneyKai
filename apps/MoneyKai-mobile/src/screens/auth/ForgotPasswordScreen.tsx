import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { isFirebaseConfigured } from '@/firebase/firebaseConfig';
import { requestPasswordResetEmail } from '@/services/authService';
import type { AuthStackParamList } from '@/navigation/types';

type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!isFirebaseConfigured()) {
      Alert.alert(
        'Demo Mode',
        'Password reset emails require Firebase to be configured. Add android/app/google-services.json.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await requestPasswordResetEmail(normalizedEmail);
      setSentEmail(normalizedEmail);
      setSent(true);
    } catch (err) {
      if (isPasswordResetEnumerationError(err)) {
        setSentEmail(normalizedEmail);
        setSent(true);
        return;
      }

      Alert.alert('Reset Failed', getPasswordResetErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: Spacing.xl,
            paddingVertical: Spacing['2xl'],
          }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: Spacing.lg }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: BorderRadius.xl,
              padding: Spacing.xl,
              ...Shadows.lg,
              shadowColor: colors.shadowColor,
            }}
          >
            {!sent ? (
              <>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: colors.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'center',
                    marginBottom: Spacing.lg,
                  }}
                >
                  <MaterialCommunityIcons name="lock-reset" size={32} color={colors.primary} />
                </View>
                <Text
                  style={{
                    fontSize: Typography.fontSize.xl,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: colors.textPrimary,
                    textAlign: 'center',
                    marginBottom: Spacing.sm,
                  }}
                >
                  Forgot Password?
                </Text>
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    fontFamily: Typography.fontFamily.regular,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    marginBottom: Spacing.xl,
                    lineHeight: 22,
                  }}
                >
                  No worries. Enter your email and we'll send you a link to reset your password.
                </Text>
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  icon="email-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
                <Button title="Send Reset Link" onPress={handleReset} fullWidth size="lg" loading={isLoading} />
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: colors.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: Spacing.lg,
                  }}
                >
                  <MaterialCommunityIcons name="email-check-outline" size={40} color={colors.primary} />
                </View>
                <Text
                  style={{
                    fontSize: Typography.fontSize.xl,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: colors.textPrimary,
                    textAlign: 'center',
                    marginBottom: Spacing.sm,
                  }}
                >
                  Check your email
                </Text>
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    fontFamily: Typography.fontFamily.regular,
                    color: colors.textSecondary,
                    textAlign: 'center',
                    lineHeight: 22,
                  }}
                >
                  If a MoneyKai account can receive resets, a link will be sent to {sentEmail}
                </Text>
                <Button
                  title="Back to Login"
                  onPress={() => navigation.goBack()}
                  variant="secondary"
                  style={{ marginTop: Spacing.xl }}
                />
              </View>
            )}
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
