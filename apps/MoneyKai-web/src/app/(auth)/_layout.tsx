import { Stack } from 'expo-router';
import { Colors, type ColorScheme } from '@/constants/theme';

export default function AuthLayout() {
  const colors = Colors.jetLuxuryLight as ColorScheme;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
