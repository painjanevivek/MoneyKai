import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthShell } from '@/components/auth/AuthShell';
import { SeoHead } from '@/components/marketing/SeoHead';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const getFriendlyAuthMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : '';
  const lower = message.toLowerCase();

  if (lower.includes('not configured')) {
    return 'Sign in is unavailable because authentication is not configured for this deployment.';
  }
  if (lower.includes('invalid') || lower.includes('wrong') || lower.includes('user-not-found')) {
    return 'The email or password does not match a MoneyKai account. Check the details and try again.';
  }
  if (lower.includes('too-many-requests')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  if (lower.includes('popup') || lower.includes('blocked') || lower.includes('cancelled')) {
    return 'Google sign-in needs a popup in this browser. Allow popups for MoneyKai and try again, or use email login.';
  }
  if (lower.includes('unauthorized-domain')) {
    return 'Add moneykai.com and www.moneykai.com to Firebase Authentication authorized domains, then retry Google sign-in.';
  }
  if (lower.includes('content security policy') || lower.includes('script-src')) {
    return 'Google sign-in is blocked by the website security policy. Redeploy MoneyKai with the updated CSP and try again.';
  }

  return 'Please check your details and try again.';
};

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signIn, signInWithGoogle, isLoading, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (submitting.current) return;
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Minimum 6 characters';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    submitting.current = true;
    try {
      await signIn(email, password);
    } catch (err) {
      Alert.alert('Login Failed', getFriendlyAuthMessage(err));
    } finally {
      submitting.current = false;
    }
  };

  const handleGoogleSignIn = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      Alert.alert('Google Sign-In Failed', getFriendlyAuthMessage(err));
    } finally {
      setGoogleLoading(false);
      submitting.current = false;
    }
  };

  const googleColors = {
    blue: '#4285F4',
    red: '#EA4335',
    yellow: '#FBBC05',
    green: '#34A853',
  };

  return (
    <>
      <SeoHead
        title="Sign in to MoneyKai | Personal finance dashboard"
        description="Sign in to your MoneyKai account to manage budgets, expenses, savings, notes, and shared spending."
        path="/login"
        robots="noindex,nofollow"
      />
      <AuthShell
        eyebrow="SECURE SIGN IN"
        title="Pick up exactly where your money left off."
        subtitle="Return to reviewed transactions, budgets, portfolio records, and AI summaries in one private workspace."
      >
      <KeyboardAvoidingView
        style={{ width: '100%' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ width: '100%' }}>
          <View style={{
            backgroundColor: colors.card,
            borderRadius: BorderRadius.xl,
            padding: Spacing.xl,
            borderWidth: 1,
            borderColor: colors.borderLight,
            ...Shadows.lg,
            shadowColor: colors.shadowColor,
          }}>
            <Text style={{
              fontSize: Typography.fontSize.xl,
              fontFamily: Typography.fontFamily.display,
              color: colors.textPrimary,
              marginBottom: Spacing.xs,
            }}>Welcome back</Text>
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 21, color: colors.textSecondary, marginBottom: Spacing.xl }}>
              Sign in to continue your reviewed money workspace.
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.sm,
                backgroundColor: colors.primaryBg,
                borderRadius: BorderRadius.sm,
                borderWidth: 1,
                borderColor: `${colors.primary}22`,
                marginBottom: Spacing.lg,
                padding: Spacing.md,
              }}
            >
              <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textPrimary }}>
                We will take you straight back to budgets, records, and reports. No reset, no tour loop.
              </Text>
            </View>

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              icon="email-outline"
              testID="login-email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              icon="lock-outline"
              testID="login-password"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={() => {
                void handleLogin();
              }}
              onKeyPress={(event) => {
                if (event.nativeEvent.key === 'Enter') {
                  void handleLogin();
                }
              }}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={{ alignSelf: 'flex-end', marginBottom: Spacing.lg, marginTop: -Spacing.sm }}
            >
              <Text style={{
                fontSize: Typography.fontSize.sm,
                fontFamily: Typography.fontFamily.medium,
                color: colors.primary,
              }}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading || googleLoading}
              fullWidth
              size="lg"
              icon="login"
              testID="login-submit"
            />

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{
                marginHorizontal: Spacing.md,
                fontSize: Typography.fontSize.sm,
                fontFamily: Typography.fontFamily.regular,
                color: colors.textTertiary,
              }}>or continue with</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            {/* Social Login Buttons */}
            <View style={{ gap: Spacing.md }}>
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                testID="login-google"
                disabled={googleLoading}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.lg,
                  borderRadius: BorderRadius.xl,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  backgroundColor: colors.surface,
                  gap: Spacing.md,
                  opacity: googleLoading ? 0.6 : 1,
                  ...Shadows.sm,
                  shadowColor: colors.shadowColor,
                }}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                ) : (
                  <>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: '#F1F3F4',
                      }}
                    >
                      <Text style={{ fontSize: 18, fontFamily: Typography.fontFamily.bold, lineHeight: 20 }}>
                        <Text style={{ color: googleColors.blue }}>G</Text>
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: Typography.fontSize.base,
                      fontFamily: Typography.fontFamily.semiBold,
                      color: colors.textPrimary,
                    }}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl }}>
            <Text style={{
              fontSize: Typography.fontSize.base,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textSecondary,
            }}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={{
                fontSize: Typography.fontSize.base,
                fontFamily: Typography.fontFamily.semiBold,
                color: colors.primary,
              }}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      </AuthShell>
    </>
  );
}
