import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Color Palette ───────────────────────────────────────────────────────────
export const Colors = {
  light: {
    primary: '#0D8C4C',
    primaryLight: '#22C55E',
    primaryDark: '#065F33',
    primaryBg: '#E8F5EE',
    accent: '#F4A261',
    accentLight: '#FEF3E2',
    emergency: '#FF5A5A',
    emergencyBg: '#FFF0F0',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    textPrimary: '#1E293B',
    textSecondary: '#6B7280',
    textTertiary: '#94A3B8',
    textInverse: '#FFFFFF',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    // Chart colors
    chart1: '#0D8C4C',
    chart2: '#3B82F6',
    chart3: '#F4A261',
    chart4: '#8B5CF6',
    chart5: '#EC4899',
    chart6: '#14B8A6',
    chart7: '#F59E0B',
    chart8: '#6366F1',
    // Shadows
    shadowColor: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    glassBg: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',
  },
  dark: {
    primary: '#22C55E',
    primaryLight: '#4ADE80',
    primaryDark: '#0D8C4C',
    primaryBg: '#0F2A1B',
    accent: '#F4A261',
    accentLight: '#2A2015',
    emergency: '#FF5A5A',
    emergencyBg: '#2A1515',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceElevated: '#273548',
    card: '#1E293B',
    border: '#334155',
    borderLight: '#1E293B',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textInverse: '#0F172A',
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
    chart1: '#22C55E',
    chart2: '#60A5FA',
    chart3: '#F4A261',
    chart4: '#A78BFA',
    chart5: '#F472B6',
    chart6: '#2DD4BF',
    chart7: '#FBBF24',
    chart8: '#818CF8',
    shadowColor: '#000000',
    overlay: 'rgba(0, 0, 0, 0.7)',
    glassBg: 'rgba(30, 41, 59, 0.85)',
    glassBorder: 'rgba(51, 65, 85, 0.5)',
  },
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────
export const Typography = {
  fontFamily: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
  },
  lineHeight: {
    xs: 14,
    sm: 18,
    base: 22,
    md: 24,
    lg: 28,
    xl: 30,
    '2xl': 34,
    '3xl': 38,
    '4xl': 42,
    '5xl': 52,
  },
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  }),
} as const;

// ─── Layout ──────────────────────────────────────────────────────────────────
export const Layout = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  maxContentWidth: 428,
  tabBarHeight: 80,
  headerHeight: 56,
} as const;

export type ThemeMode = 'light' | 'dark';
export type ColorScheme = typeof Colors.light;
