import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firebaseAuth, isFirebaseConfigured } from '@/services/firebase';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: Spacing.xl,
            paddingVertical: Spacing['2xl'],
          }}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: Spacing.lg }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={{
            backgroundColor: colors.card,
            borderRadius: BorderRadius.xl,
            padding: Spacing.xl,
            ...Shadows.lg,
            shadowColor: colors.shadowColor,
          }}>
            {!sent ? (
              <>
                <View style={{
                  width: 64, height: 64, borderRadius: 32,
                  backgroundColor: colors.primaryBg,
                  alignItems: 'center', justifyContent: 'center',
                  alignSelf: 'center', marginBottom: Spacing.lg,
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
                  backgroundColor: colors.primaryBg,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: Spacing.lg,
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
                  onPress={() => router.back()}
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

