import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MoneyKaiBrandMark } from '@/components/branding/MoneyKaiBrandMark';
import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import { Input } from '@/components/ui/Input';
import { PressableScale } from '@/components/ui/PressableScale';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function ProgressiveLoginScreen({ navigation }: Props) {
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
    if (submitting.current) return;
    const nextErrors: typeof errors = {};
    if (!email) nextErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = 'Enter a valid email';
    if (!password) nextErrors.password = 'Password is required';
    else if (password.length < 6) nextErrors.password = 'Minimum 6 characters';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    submitting.current = true;
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Check your credentials and try again.');
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
    } catch (error) {
      Alert.alert('Google sign-in failed', error instanceof Error ? error.message : 'Use email sign-in while Google is unavailable.');
    } finally {
      setGoogleLoading(false);
      submitting.current = false;
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: colors.background, flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing['2xl'] }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'flex-start', marginBottom: Spacing['2xl'] }}>
            <View style={{ alignItems: 'center', backgroundColor: colors.textPrimary, borderRadius: BorderRadius.lg, height: 64, justifyContent: 'center', marginBottom: Spacing.lg, overflow: 'hidden', width: 64 }}>
              <MoneyKaiBrandMark size={64} />
            </View>
            <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize['3xl'], lineHeight: Typography.lineHeight['3xl'] }}>MoneyKai</Text>
            <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.base, lineHeight: Typography.lineHeight.base, marginTop: Spacing.xs }}>A calmer way to keep everyday money records.</Text>
          </View>

          <View style={{ backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.xl }}>
            <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.display, fontSize: Typography.fontSize.xl }}>Welcome back</Text>
            <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm, lineHeight: Typography.lineHeight.sm, marginBottom: Spacing.lg, marginTop: Spacing.xs }}>Sign in to restore your account-backed workspace.</Text>

            <PressableScale
              accessibilityLabel="Continue with Google"
              accessibilityRole="button"
              disabled={googleLoading || isLoading}
              onPress={handleGoogleSignIn}
              style={{ alignItems: 'center', backgroundColor: colors.textPrimary, borderRadius: BorderRadius.lg, flexDirection: 'row', gap: Spacing.md, justifyContent: 'center', minHeight: 52, paddingHorizontal: Spacing.lg }}
            >
              {googleLoading ? <ActivityIndicator color={colors.textInverse} /> : <Text style={{ color: colors.textInverse, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg }}>G</Text>}
              <Text style={{ color: colors.textInverse, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base }}>Continue with Google</Text>
            </PressableScale>

            <Disclosure title="Use email and password" summary="For existing password-based accounts">
              <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} error={errors.email} icon="email-outline" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" returnKeyType="next" />
              <Input label="Password" placeholder="Enter your password" value={password} onChangeText={setPassword} error={errors.password} icon="lock-outline" secureTextEntry autoComplete="password" textContentType="password" returnKeyType="done" />
              <PressableScale accessibilityRole="button" onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' }}>
                <Text style={{ color: colors.primary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>Forgot password?</Text>
              </PressableScale>
              <Button title="Sign in with email" onPress={handleLogin} loading={isLoading} fullWidth />
            </Disclosure>
          </View>

          <View style={{ alignItems: 'center', marginTop: Spacing.lg }}>
            <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.sm }}>New to MoneyKai?</Text>
            <PressableScale accessibilityRole="button" onPress={() => navigation.navigate('Signup')} style={{ justifyContent: 'center', minHeight: 44 }}>
              <Text style={{ color: colors.primary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base }}>Create an account</Text>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
