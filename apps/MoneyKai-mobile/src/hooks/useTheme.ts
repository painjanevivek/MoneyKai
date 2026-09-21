import { Colors, type ColorScheme } from '../constants/theme';

export const useTheme = () => {
  const colors = Colors.light as ColorScheme;

  // `isDark` remains a constant compatibility signal until M03 removes the
  // duplicate presentation tree; it cannot be changed by user or system state.
  return { colors, isDark: false as const, theme: 'light' as const };
};
