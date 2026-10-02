import { Colors, type ColorScheme } from '../constants/theme';
import { useSettingsStore } from '../stores/useSettingsStore';

export const useTheme = () => {
  const theme = 'light' as const;
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const themePalette = useSettingsStore((s) => s.themePalette);
  const setThemePalette = useSettingsStore((s) => s.setThemePalette);
  const darkModeEnabled = false;
  const setDarkModeEnabled = useSettingsStore((s) => s.setDarkModeEnabled);

  const colors = (Colors[theme] ?? Colors.light) as ColorScheme;
  const isDark = false;

  return { colors, darkModeEnabled, isDark, setDarkModeEnabled, setTheme, setThemePalette, theme, themePalette, toggleTheme };
};
