import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import type { AuthStackParamList } from '@/navigation/types';

type SignupScreenProps = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const SETUP_PROMISES = [
  'Create your private SMS parsing workspace',
  'Review one parsed money record',
  'Let budgets and reports follow confirmed records',
] as const;

export function SignupScreen({ navigation }: SignupScreenProps) {
  const { colors } = useTheme();
  const signUp = useAuthStore((state) => state.signUp);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitting = useRef(false);

  const handleSignUp = async () => {
    if (submitting.current) {
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!password || password.length < 8) {
      newErrors.password = 'Minimum 8 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    submitting.current = true;
    try {
      await signUp(email.trim(), password, fullName.trim());
    } catch (err) {
      Alert.alert('Sign Up Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
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
          <AuthHeader onBack={() => navigation.goBack()} />
          <View style={{ alignSelf: 'center', flexGrow: 1, justifyContent: 'center', maxWidth: 440, paddingVertical: Spacing.xl, width: '100%' }}>
          <View style={{ marginBottom: Spacing.xl }}>
            <Text
              style={{
                fontSize: Typography.fontSize['5xl'],
                fontFamily: Typography.fontFamily.display,
                color: colors.textPrimary,
                lineHeight: Typography.lineHeight['5xl'],
                textAlign: 'center',
              }}
            >
              Create account
            </Text>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontFamily: Typography.fontFamily.regular,
                color: colors.textSecondary,
                lineHeight: Typography.lineHeight.md,
                marginTop: Spacing.xs,
                textAlign: 'center',
              }}
            >
              Turn bank and payment SMS alerts into reviewable money records.
            </Text>
          </View>

          <View
            style={{
              backgroundColor: colors.primaryBg,
              borderColor: `${colors.primary}22`,
              borderRadius: BorderRadius.sm,
              borderWidth: 1,
              gap: Spacing.sm,
              marginBottom: Spacing.lg,
              padding: Spacing.md,
            }}
          >
            {SETUP_PROMISES.map((promise, index) => (
              <View key={promise} style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.sm }}>
                <View
                  style={{
                    alignItems: 'center',
                    backgroundColor: colors.card,
                    borderColor: colors.borderLight,
                    borderRadius: BorderRadius.full,
                    borderWidth: 1,
                    height: 24,
                    justifyContent: 'center',
                    width: 24,
                  }}
                >
                  <Text style={{ color: colors.primary, fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs }}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={{ color: colors.textPrimary, flex: 1, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm }}>
                  {promise}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: BorderRadius.xl,
              padding: Spacing.xl,
              ...Shadows.lg,
              shadowColor: colors.shadowColor,
            }}
          >
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
              icon="account-outline"
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
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={isLoading}
              fullWidth
              size="lg"
              icon="account-plus-outline"
              style={{ marginTop: Spacing.md }}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl }}>
            <Text
              style={{
                fontSize: Typography.fontSize.base,
                fontFamily: Typography.fontFamily.regular,
                color: colors.textSecondary,
              }}
            >
              Already have an account?{' '}
            </Text>
            <TouchableOpacity accessibilityLabel="Sign in" accessibilityRole="button" onPress={() => navigation.goBack()}>
              <Text
                style={{
                  fontSize: Typography.fontSize.base,
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.primary,
                }}
              >
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
