import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupScreen() {
  const { colors } = useTheme();
  const { signUp, isLoading } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitting = useRef(false);

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
      router.replace('/(tabs)');
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
          {/* Header */}
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: Spacing.lg }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={{ marginBottom: Spacing['2xl'] }}>
            <Text style={{
              fontSize: Typography.fontSize['2xl'],
              fontFamily: Typography.fontFamily.bold,
              color: colors.textPrimary,
            }}>Create account</Text>
            <Text style={{
              fontSize: Typography.fontSize.base,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textSecondary,
              marginTop: 4,
            }}>Start your journey to financial discipline</Text>
          </View>

          {/* Form */}
          <View style={{
            backgroundColor: colors.card,
            borderRadius: BorderRadius.xl,
            padding: Spacing.xl,
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
            />
            <Input
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              icon="lock-outline"
              secureTextEntry
            />
            <Input
              label="Confirm Password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              icon="lock-check-outline"
              secureTextEntry
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
