import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
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
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signIn, signInWithGoogle, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const submitting = useRef(false);

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
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Login Failed', err instanceof Error ? err.message : 'Please check your credentials and try again.');
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
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Google Sign-In Failed', err instanceof Error ? err.message : 'Google Sign-In is not available. Please use email login.');
    } finally {
      setGoogleLoading(false);
      submitting.current = false;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: Spacing.xl,
            paddingVertical: Spacing['2xl'],
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Branding */}
          <View style={{ alignItems: 'center', marginBottom: Spacing['3xl'] }}>
            <View style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing.base,
              ...Shadows.lg,
              shadowColor: colors.primary,
            }}>
              <MaterialCommunityIcons name="chart-line" size={36} color={colors.textInverse} />
            </View>
            <Text style={{
              fontSize: Typography.fontSize['3xl'],
              fontFamily: Typography.fontFamily.bold,
              color: colors.textPrimary,
            }}>MoneyKai</Text>
            <Text style={{
              fontSize: Typography.fontSize.base,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textSecondary,
              marginTop: 4,
            }}>Spend Smart. Save More.</Text>
          </View>

          {/* Login Form */}
          <View style={{
            backgroundColor: colors.card,
            borderRadius: BorderRadius.xl,
            padding: Spacing.xl,
            ...Shadows.lg,
            shadowColor: colors.shadowColor,
          }}>
            <Text style={{
              fontSize: Typography.fontSize.xl,
              fontFamily: Typography.fontFamily.semiBold,
              color: colors.textPrimary,
              marginBottom: Spacing.xl,
            }}>Welcome back</Text>

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              icon="email-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              icon="lock-outline"
              secureTextEntry
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
              fullWidth
              size="lg"
              icon="login"
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
              {/* Google Sign In */}
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={googleLoading}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: Spacing.md,
                  borderRadius: BorderRadius.md,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  gap: Spacing.sm,
                  opacity: googleLoading ? 0.6 : 1,
                }}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                ) : (
                  <>
                    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="google" size={22} color="#DB4437" />
                    </View>
                    <Text style={{
                      fontSize: Typography.fontSize.base,
                      fontFamily: Typography.fontFamily.medium,
                      color: colors.textPrimary,
                    }}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Demo Account Hint */}
            <View style={{
              marginTop: Spacing.lg,
              padding: Spacing.md,
              backgroundColor: colors.primaryBg,
              borderRadius: BorderRadius.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
            }}>
              <MaterialCommunityIcons name="information-outline" size={18} color={colors.primary} />
              <Text style={{
                flex: 1,
                fontSize: Typography.fontSize.xs,
                fontFamily: Typography.fontFamily.regular,
                color: colors.primary,
                lineHeight: 16,
              }}>Connect Firebase to enable production authentication.</Text>
            </View>
          </View>

          {/* Sign Up Link */}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

