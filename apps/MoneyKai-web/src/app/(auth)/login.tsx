import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthFooter } from '@/components/auth/AuthFooter';
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
  const { width } = useWindowDimensions();
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
  const isWide = width >= 900;
  const cardRadius = isWide ? 28 : BorderRadius.xl;

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
        showHero={false}
      >
      <KeyboardAvoidingView
        style={{ width: '100%' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ width: '100%' }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: cardRadius,
              borderWidth: 1,
              borderColor: colors.borderLight,
              flexDirection: isWide ? 'row' : 'column',
              gap: isWide ? Spacing['3xl'] : Spacing.xl,
              justifyContent: 'space-between',
              minHeight: isWide ? 390 : undefined,
              padding: isWide ? Spacing['3xl'] : Spacing.xl,
              ...Shadows.lg,
              shadowColor: colors.shadowColor,
            }}
          >
            <View
              style={{
                flex: 1,
                justifyContent: 'space-between',
                maxWidth: isWide ? 470 : undefined,
                minHeight: isWide ? 270 : undefined,
              }}
            >
            <View
              style={{
                  width: 58,
                  height: 58,
                  borderRadius: BorderRadius.md,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  ...Shadows.sm,
                  shadowColor: colors.shadowColor,
              }}
            >
              <Image
                source={require('../../../assets/images/moneykai-logo.png')}
                  style={{ width: 42, height: 42 }}
                resizeMode="contain"
                accessibilityLabel="MoneyKai logo"
              />
            </View>

              <View style={{ marginTop: isWide ? Spacing['2xl'] : Spacing.lg }}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontFamily: Typography.fontFamily.display,
                    fontSize: isWide ? 44 : Typography.fontSize['3xl'],
                    lineHeight: isWide ? 52 : 40,
                  }}
                >
                  Sign in
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontFamily: Typography.fontFamily.regular,
                    fontSize: Typography.fontSize.md,
                    lineHeight: 25,
                    marginTop: Spacing.md,
                    maxWidth: 420,
                  }}
                >
                  with your MoneyKai account. Your private workspace stays available across budgets, records, and reports.
                </Text>
              </View>
            </View>

            <View style={{ flex: 1.12, justifyContent: 'space-between', maxWidth: isWide ? 560 : undefined }}>
              <View>
            <Input
              label="Email"
                    placeholder="Email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              testID="login-email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <Input
              label="Password"
                    placeholder="Password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
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
                    accessibilityRole="link"
                    accessibilityLabel="Reset your MoneyKai password"
                    style={{ alignSelf: 'flex-start', marginBottom: Spacing.xl, marginTop: -Spacing.sm }}
            >
              <Text style={{
                fontSize: Typography.fontSize.sm,
                      fontFamily: Typography.fontFamily.semiBold,
                color: colors.primary,
              }}>Forgot Password?</Text>
            </TouchableOpacity>
              </View>

              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: Typography.fontSize.sm,
                  lineHeight: 21,
                  marginBottom: Spacing.lg,
                }}
              >
                Use MoneyKai only on devices you trust. Review sign-in activity from settings after you enter your workspace.
              </Text>

              <View style={{ alignItems: 'center', flexDirection: isWide ? 'row' : 'column-reverse', gap: Spacing.md, justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => router.push('/(auth)/signup')} accessibilityRole="link" accessibilityLabel="Create a MoneyKai account">
                  <Text style={{
                    fontSize: Typography.fontSize.base,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: colors.primary,
                  }}>Create account</Text>
                </TouchableOpacity>
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading || googleLoading}
                  fullWidth={!isWide}
              size="lg"
              testID="login-submit"
                  style={{ minWidth: isWide ? 132 : undefined }}
            />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{
                marginHorizontal: Spacing.md,
                fontSize: Typography.fontSize.sm,
                fontFamily: Typography.fontFamily.regular,
                color: colors.textTertiary,
              }}>or continue with</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

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

          <AuthFooter />
        </View>
      </KeyboardAvoidingView>
      </AuthShell>
    </>
  );
}
