import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthShell } from '@/components/auth/AuthShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const getFriendlySignupMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : '';
  const lower = message.toLowerCase();

  if (lower.includes('not configured')) {
    return 'Account creation is unavailable because authentication is not configured for this deployment.';
  }
  if (lower.includes('email-already-in-use')) {
    return 'An account already exists for this email. Try signing in instead.';
  }
  if (lower.includes('weak-password')) {
    return 'Use a stronger password with at least 8 characters.';
  }

  return 'Please check the form and try again.';
};

const SETUP_PROMISES = [
  'Create your private workspace',
  'Set a budget or add one record',
  'Review dashboard insights before acting',
] as const;

export default function SignupScreen() {
  const { colors } = useTheme();
  const { signUp, isLoading, isAuthenticated } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitting = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated]);

  const handleSignUp = async () => {
    if (submitting.current) return;
    const newErrors: Record<string, string> = {};
    if (!fullName || fullName.length < 2) newErrors.fullName = 'Name must be at least 2 characters';
    if (!email || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password || password.length < 8) newErrors.password = 'Minimum 8 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    submitting.current = true;
    try {
      await signUp(email, password, fullName);
    } catch (err) {
      Alert.alert('Sign Up Failed', getFriendlySignupMessage(err));
    } finally {
      submitting.current = false;
    }
  };

  return (
    <>
      <SeoHead
        title="Create a MoneyKai account | Budget and expense tracker"
        description="Create a MoneyKai account to start tracking expenses, budgets, savings, and shared money in one workspace."
        path="/signup"
        robots="noindex,nofollow"
      />
      <AuthShell
        eyebrow="PRIVATE ONBOARDING"
        title="Start with the records you trust MoneyKai with."
        subtitle="Create a workspace for budgets, imports, holdings, shared expenses, and calm monthly review."
      >
      <KeyboardAvoidingView style={{ width: '100%' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ width: '100%' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: Spacing.lg }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={{ marginBottom: Spacing['2xl'] }}>
            <Text style={{
              fontSize: Typography.fontSize['2xl'],
              fontFamily: Typography.fontFamily.display,
              color: colors.textPrimary,
            }}>Create account</Text>
            <Text style={{
              fontSize: Typography.fontSize.base,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textSecondary,
              marginTop: 4,
            }}>Create a home for your money.</Text>
          </View>

          <View
            style={{
              backgroundColor: colors.primaryBg,
              borderRadius: BorderRadius.sm,
              borderWidth: 1,
              borderColor: `${colors.primary}22`,
              marginBottom: Spacing.lg,
              padding: Spacing.md,
              gap: Spacing.sm,
            }}
          >
            {SETUP_PROMISES.map((promise, index) => (
              <View key={promise} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: BorderRadius.full,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                  }}
                >
                  <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.bold, color: colors.primary }}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: colors.textPrimary }}>
                  {promise}
                </Text>
              </View>
            ))}
          </View>

          <View style={{
            backgroundColor: colors.card,
            borderRadius: BorderRadius.xl,
            padding: Spacing.xl,
            borderWidth: 1,
            borderColor: colors.borderLight,
            ...Shadows.lg,
            shadowColor: colors.shadowColor,
          }}>
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
              icon="account-outline"
              testID="signup-full-name"
              autoComplete="name"
              textContentType="name"
            />
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              icon="email-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              testID="signup-email"
              autoComplete="email"
              textContentType="emailAddress"
            />
            <Input
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              icon="lock-outline"
              secureTextEntry
              testID="signup-password"
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <Input
              label="Confirm Password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              icon="lock-check-outline"
              secureTextEntry
              testID="signup-confirm-password"
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              size="lg"
              icon="account-plus-outline"
              testID="signup-submit"
              style={{ marginTop: Spacing.md }}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl }}>
            <Text style={{
              fontSize: Typography.fontSize.base,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textSecondary,
            }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{
                fontSize: Typography.fontSize.base,
                fontFamily: Typography.fontFamily.semiBold,
                color: colors.primary,
              }}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      </AuthShell>
    </>
  );
}
