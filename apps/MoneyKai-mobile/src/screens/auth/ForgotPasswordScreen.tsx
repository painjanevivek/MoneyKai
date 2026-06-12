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
import { sendFirebasePasswordResetEmail } from '@/services/authService';
import type { AuthStackParamList } from '@/navigation/types';

type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!isFirebaseConfigured()) {
      Alert.alert(
        'Demo Mode',
        'Password reset emails require Firebase to be configured. Add android/app/google-services.json and set the MONEYKAI_FIREBASE_* values.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await sendFirebasePasswordResetEmail(email.trim());
      setSent(true);
    } catch (err) {
      Alert.alert('Reset Failed', err instanceof Error ? err.message : 'Could not send the reset link. Please try again.');
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
                  We've sent a password reset link to {email.trim()}
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
