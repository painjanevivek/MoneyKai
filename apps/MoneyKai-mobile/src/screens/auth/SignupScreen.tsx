import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import type { AuthStackParamList } from '@/navigation/types';

type SignupScreenProps = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export function SignupScreen({ navigation }: SignupScreenProps) {
  const { colors } = useTheme();
  const { signUp, isLoading } = useAuthStore();
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
            justifyContent: 'center',
            paddingHorizontal: Spacing.xl,
            paddingVertical: Spacing['2xl'],
          }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: Spacing.lg }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={{ marginBottom: Spacing['2xl'] }}>
            <Text
              style={{
                fontSize: Typography.fontSize['2xl'],
                fontFamily: Typography.fontFamily.display,
                color: colors.textPrimary,
              }}
            >
              Create account
            </Text>
            <Text
              style={{
                fontSize: Typography.fontSize.base,
                fontFamily: Typography.fontFamily.regular,
                color: colors.textSecondary,
                marginTop: 4,
              }}
            >
              Create a home for your money.
            </Text>
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
            <TouchableOpacity onPress={() => navigation.goBack()}>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
