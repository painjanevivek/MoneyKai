import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import type { AuthStackParamList } from '@/navigation/types';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { colors } = useTheme();
  const { signIn, signInWithGoogle, isLoading } = useAuthStore();
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
            justifyContent: 'center',
            paddingHorizontal: Spacing.xl,
            paddingVertical: Spacing['2xl'],
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: Spacing['3xl'] }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: Spacing.base,
                borderWidth: 1,
                borderColor: colors.borderLight,
                ...Shadows.lg,
                shadowColor: colors.shadowColor,
              }}
            >
              <Image
                source={require('../../../assets/images/moneykai-logo.png')}
                style={{ width: 44, height: 44 }}
                resizeMode="contain"
              />
            </View>
            <Text
              style={{
                fontSize: Typography.fontSize['3xl'],
                fontFamily: Typography.fontFamily.display,
                color: colors.textPrimary,
              }}
            >
              MoneyKai
            </Text>
            <Text
              style={{
                fontSize: Typography.fontSize.base,
                fontFamily: Typography.fontFamily.regular,
                color: colors.textSecondary,
                marginTop: 4,
              }}
            >
              Money that feels easier to manage.
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
            <Text
              style={{
                fontSize: Typography.fontSize.xl,
                fontFamily: Typography.fontFamily.display,
                color: colors.textPrimary,
                marginBottom: Spacing.xl,
              }}
            >
              Welcome back
            </Text>

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
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={{ alignSelf: 'flex-end', marginBottom: Spacing.lg, marginTop: -Spacing.sm }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  fontFamily: Typography.fontFamily.medium,
                  color: colors.primary,
                }}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <Button title="Sign In" onPress={handleLogin} loading={isLoading} fullWidth size="lg" icon="login" />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text
                style={{
                  marginHorizontal: Spacing.md,
                  fontSize: Typography.fontSize.sm,
                  fontFamily: Typography.fontFamily.regular,
                  color: colors.textTertiary,
                }}
              >
                or continue with
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            <TouchableOpacity
              onPress={handleGoogleSignIn}
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
                    <Text style={{ fontSize: 18, fontFamily: Typography.fontFamily.bold, lineHeight: 20, color: '#4285F4' }}>
                      G
                    </Text>
                  </View>
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
          </View>

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
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text
                style={{
                  fontSize: Typography.fontSize.base,
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.primary,
                }}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
