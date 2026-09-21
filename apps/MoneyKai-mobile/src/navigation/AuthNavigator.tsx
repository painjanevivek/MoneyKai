import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import { ProgressiveLoginScreen } from '@/screens/auth/ProgressiveLoginScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { useAppMotion } from '@/hooks/useAppMotion';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const { reduceMotion } = useAppMotion();

  return (
    <Stack.Navigator screenOptions={{ animation: reduceMotion ? 'none' : 'fade_from_bottom', headerShown: false }}>
      <Stack.Screen name="Login" component={ProgressiveLoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
