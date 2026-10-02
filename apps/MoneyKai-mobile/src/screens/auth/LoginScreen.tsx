import React, { useRef, useState } from 'react';
import { isGoogleSignInCancelled } from '@/services/nativeGoogleSignIn';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FeatureCanvas } from '@/components/ui/EditorialLayout';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { GoogleBrandMark } from '@/components/branding/GoogleBrandMark';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import type { AuthStackParamList } from '@/navigation/types';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { colors } = useTheme();
  const signIn = useAuthStore((state) => state.signIn);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const submitting = useRef(false);

  const handleLogin = async () => {
    if (submitting.current) {
      return;
    }

    const newErrors: typeof errors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Minimum 6 characters';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    submitting.current = true;
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err instanceof Error ? err.message : 'Please check your credentials and try again.');
    } finally {
      submitting.current = false;
    }
  };

  const handleGoogleSignIn = async () => {
    if (submitting.current) {
      return;
    }

    submitting.current = true;
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      if (isGoogleSignInCancelled(err)) return;
      Alert.alert(
        'Google Sign-In Failed',
        err instanceof Error ? err.message : 'Google Sign-In is not available. Please use email login.'
      );
    } finally {
      setGoogleLoading(false);
      submitting.current = false;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.md,
            paddingBottom: Spacing.xl,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader />
          <View style={{ alignSelf: 'center', flexGrow: 1, justifyContent: 'center', maxWidth: 440, paddingVertical: Spacing.xl, width: '100%' }}>
          <View style={{ marginBottom: Spacing.xl }}>
            <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize['5xl'], letterSpacing: -0.9, lineHeight: Typography.lineHeight['5xl'], textAlign: 'center' }}>
              Welcome back
            </Text>
            <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.md, marginTop: Spacing.xs, textAlign: 'center' }}>
              Your spending, budgets, and shared balances are ready when you are.
            </Text>
          </View>

          <FeatureCanvas tone="paper">
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              accessibilityHint="Signs in with the same Google account used on moneykai.com"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 52,
                paddingVertical: Spacing.sm,
                paddingHorizontal: Spacing.lg,
                borderRadius: BorderRadius.sm,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                gap: Spacing.md,
                opacity: googleLoading ? 0.6 : 1,
              }}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <>
                  <GoogleBrandMark size={20} />
                  <Text
                    style={{
                      fontSize: Typography.fontSize.base,
                      fontFamily: Typography.fontFamily.semiBold,
                      color: colors.textPrimary,
                    }}
                  >
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ borderTopColor: colors.borderLight, borderTopWidth: 1, marginTop: Spacing.lg, paddingTop: Spacing.lg }}>
              <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, letterSpacing: 0.8, marginBottom: Spacing.md, textAlign: 'center' }}>
                SIGN IN WITH EMAIL
              </Text>
              <View>
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  error={errors.email}
                  icon="email-outline"
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
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />

                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  accessibilityRole="button"
                  style={{ alignSelf: 'flex-end', marginBottom: Spacing.lg, marginTop: -Spacing.sm }}
                >
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      fontFamily: Typography.fontFamily.medium,
                      color: colors.primaryDark,
                    }}
                  >
                    Forgot password?
                  </Text>
                </TouchableOpacity>

                <Button title="Sign In" onPress={handleLogin} loading={isLoading} fullWidth size="lg" icon="login" />
              </View>
            </View>

            <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.xs, justifyContent: 'center', marginTop: Spacing.md }}>
              <Text style={{ color: colors.textTertiary, fontFamily: Typography.fontFamily.regular, fontSize: 12 }}>
                Private by default
              </Text>
              <View style={{ backgroundColor: colors.border, borderRadius: 2, height: 3, width: 3 }} />
              <Text style={{ color: colors.textTertiary, fontFamily: Typography.fontFamily.regular, fontSize: 12 }}>
                You stay in control
              </Text>
            </View>
          </FeatureCanvas>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl }}>
            <Text
              style={{
                fontSize: Typography.fontSize.base,
                fontFamily: Typography.fontFamily.regular,
                color: colors.textSecondary,
              }}
            >
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity accessibilityLabel="Sign up" accessibilityRole="button" onPress={() => navigation.navigate('Signup')}>
              <Text
                style={{
                  fontSize: Typography.fontSize.base,
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.primaryDark,
                }}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
