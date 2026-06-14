import { Colors, type ColorScheme } from '../constants/theme';
import { useSettingsStore } from '../stores/useSettingsStore';

export const useTheme = () => {
  const theme = useSettingsStore((s) => s.theme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const colors = (Colors[theme] ?? Colors.light) as ColorScheme;
  const isDark = theme === 'dark';

  return { colors, isDark, theme, toggleTheme, setTheme };
};
