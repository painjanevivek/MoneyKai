import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SignupScreen } from '@/screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen';
import { useAppMotion } from '@/hooks/useAppMotion';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const { reduceMotion } = useAppMotion();

  return (
    <Stack.Navigator screenOptions={{ animation: reduceMotion ? 'none' : 'fade_from_bottom', headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
