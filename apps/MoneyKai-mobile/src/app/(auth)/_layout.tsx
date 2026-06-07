import { Stack } from 'expo-router';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { Colors } from '@/constants/theme';

export default function AuthLayout() {
  const theme = useSettingsStore((s) => s.theme);
  const colors = Colors[theme];

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
