import { Colors, isThemeModeDark, type ColorScheme } from '../constants/theme';
import { useSettingsStore } from '../stores/useSettingsStore';

export const useTheme = () => {
  const theme = useSettingsStore((s) => s.theme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const themePalette = useSettingsStore((s) => s.themePalette);
  const setThemePalette = useSettingsStore((s) => s.setThemePalette);
  const darkModeEnabled = useSettingsStore((s) => s.darkModeEnabled);
  const setDarkModeEnabled = useSettingsStore((s) => s.setDarkModeEnabled);

  const colors = (Colors[theme] ?? Colors.light) as ColorScheme;
  const isDark = darkModeEnabled || isThemeModeDark(theme);

  return { colors, darkModeEnabled, isDark, setDarkModeEnabled, setTheme, setThemePalette, theme, themePalette, toggleTheme };
};
