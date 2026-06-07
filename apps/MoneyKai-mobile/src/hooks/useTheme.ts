import { Colors, type ColorScheme } from '../constants/theme';
import { useSettingsStore } from '../stores/useSettingsStore';

export const useTheme = () => {
  const theme = useSettingsStore((s) => s.theme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);

  const colors = Colors[theme] as ColorScheme;
  const isDark = theme === 'dark';

  return { colors, isDark, theme, toggleTheme };
};
