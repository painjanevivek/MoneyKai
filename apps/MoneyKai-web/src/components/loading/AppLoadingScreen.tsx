import { View } from 'react-native';
import { ThinkingOrb } from 'thinking-orbs';
import { type ColorScheme } from '@/constants/theme';

interface AppLoadingScreenProps {
  colors: ColorScheme;
}

/**
 * The app-shell loader shown while an authenticated route restores its session.
 */
export function AppLoadingScreen({ colors }: AppLoadingScreenProps) {
  return (
    <View
      accessibilityLabel="Loading MoneyKai"
      accessibilityRole="progressbar"
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ThinkingOrb
        state="searching"
        size={64}
        speed={1}
        theme="light"
        aria-label="Loading MoneyKai"
      />
    </View>
  );
}
