import { Colors, type ColorScheme } from '../constants/theme';
import { useSettingsStore } from '../stores/useSettingsStore';

export const useTheme = () => {
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setThemePalette = useSettingsStore((s) => s.setThemePalette);
  const setDarkModeEnabled = useSettingsStore((s) => s.setDarkModeEnabled);

  // Keep legacy theme data compatible with restored backups, but do not let it
  // change MoneyKai's single light visual system.
  const colors = Colors.jetLuxuryLight as ColorScheme;
  const isDark = false;

  return {
    colors,
    darkModeEnabled: false,
    isDark,
    setDarkModeEnabled,
    setTheme,
    setThemePalette,
    theme: 'jetLuxuryLight' as const,
    themePalette: 'jetLuxury' as const,
    toggleTheme,
  };
};
