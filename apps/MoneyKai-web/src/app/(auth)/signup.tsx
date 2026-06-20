import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
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

export default function SignupScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { signUp, isLoading, isAuthenticated } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitting = useRef(false);
  const isWide = width >= 900;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated]);

  const handleSignInPress = () => {
    router.replace('/login');
  };

  const handleSignUp = async () => {
    if (submitting.current) return;
    const newErrors: Record<string, string> = {};
    const fullName = `${firstName.trim()} ${surname.trim()}`.trim();
    if (!firstName.trim() || firstName.trim().length < 2) newErrors.firstName = 'First name must be at least 2 characters';
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
        showHero={false}
      >
      <KeyboardAvoidingView style={{ width: '100%' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ width: '100%' }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: isWide ? 28 : BorderRadius.xl,
              borderWidth: 1,
              borderColor: colors.borderLight,
              flexDirection: isWide ? 'row' : 'column',
              gap: isWide ? Spacing['3xl'] : Spacing.xl,
              justifyContent: 'space-between',
              minHeight: isWide ? 430 : undefined,
              padding: isWide ? Spacing['3xl'] : Spacing.xl,
              ...Shadows.lg,
              shadowColor: colors.shadowColor,
            }}
          >
            <View
              style={{
                flex: 1,
                justifyContent: 'space-between',
                maxWidth: isWide ? 520 : undefined,
                minHeight: isWide ? 300 : undefined,
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
                  Create a MoneyKai Account
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontFamily: Typography.fontFamily.regular,
                    fontSize: Typography.fontSize.lg,
                    lineHeight: 28,
                    marginTop: Spacing.lg,
                  }}
                >
                  Enter your details
                </Text>
              </View>
            </View>

            <View style={{ flex: 1.12, justifyContent: 'space-between', maxWidth: isWide ? 590 : undefined }}>
              <View>
                <View style={{ flexDirection: isWide ? 'row' : 'column', gap: isWide ? Spacing.md : 0 }}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="First name"
                      placeholder="First name"
                      value={firstName}
                      onChangeText={setFirstName}
                      error={errors.firstName}
                      testID="signup-first-name"
                      autoComplete="given-name"
                      textContentType="givenName"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Surname (optional)"
                      placeholder="Surname"
                      value={surname}
                      onChangeText={setSurname}
                      testID="signup-surname"
                      autoComplete="family-name"
                      textContentType="familyName"
                      returnKeyType="next"
                    />
                  </View>
                </View>
                <Input
                  label="Email"
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  testID="signup-email"
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
                  secureTextEntry
                  testID="signup-password"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                />
                <Input
                  label="Confirm Password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  error={errors.confirmPassword}
                  secureTextEntry
                  testID="signup-confirm-password"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    void handleSignUp();
                  }}
                  onKeyPress={(event) => {
                    if (event.nativeEvent.key === 'Enter') {
                      void handleSignUp();
                    }
                  }}
                />
              </View>

              <View style={{ alignItems: 'center', flexDirection: isWide ? 'row' : 'column-reverse', gap: Spacing.md, justifyContent: 'flex-end', marginTop: Spacing.md }}>
                <TouchableOpacity onPress={handleSignInPress} accessibilityRole="link" accessibilityLabel="Sign in to your MoneyKai account">
                  <Text style={{
                    fontSize: Typography.fontSize.base,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: colors.primary,
                  }}>Sign in instead</Text>
                </TouchableOpacity>
            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={isLoading}
              disabled={isLoading}
                  fullWidth={!isWide}
              size="lg"
              testID="signup-submit"
                  style={{ minWidth: isWide ? 172 : undefined }}
            />
              </View>
            </View>
          </View>

          <View style={{ alignItems: 'center', flexDirection: isWide ? 'row' : 'column', gap: isWide ? 0 : Spacing.md, justifyContent: 'space-between', marginTop: Spacing.lg, paddingHorizontal: isWide ? Spacing.lg : 0 }}>
            <Text style={{
              fontSize: Typography.fontSize.sm,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textSecondary,
            }}>English (India)</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.lg }}>
              {[
                ['Help', '/contact'],
                ['Privacy', '/privacy-policy'],
                ['Terms', '/terms'],
              ].map(([label, href]) => (
                <TouchableOpacity key={label} onPress={() => router.push(href as any)} accessibilityRole="link" accessibilityLabel={label}>
              <Text style={{
                    fontSize: Typography.fontSize.sm,
                fontFamily: Typography.fontFamily.semiBold,
                    color: colors.textSecondary,
                  }}>{label}</Text>
            </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      </AuthShell>
    </>
  );
}
