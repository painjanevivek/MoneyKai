import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Color Palette ───────────────────────────────────────────────────────────
export const Colors = {
  light: {
    primary: '#111111',
    primaryLight: '#3A3A3A',
    primaryDark: '#000000',
    primaryBg: '#F2F2F2',
    accent: '#555555',
    accentLight: '#F5F5F5',
    emergency: '#111111',
    emergencyBg: '#EFEFEF',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    card: '#FFFFFF',
    border: '#D8D8D8',
    borderLight: '#E4E4E4',
    textPrimary: '#111111',
    textSecondary: '#4B4B4B',
    textTertiary: '#7A7A7A',
    textInverse: '#FFFFFF',
    success: '#3A3A3A',
    warning: '#5A5A5A',
    error: '#1F1F1F',
    info: '#666666',
    // Chart colors
    chart1: '#0F766E',
    chart2: '#2563EB',
    chart3: '#D97706',
    chart4: '#7C3AED',
    chart5: '#DC2626',
    chart6: '#059669',
    chart7: '#475569',
    chart8: '#0891B2',
    // Shadows
    shadowColor: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    glassBg: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',
  },
  dark: {
    primary: '#F5F5F5',
    primaryLight: '#FFFFFF',
    primaryDark: '#CFCFCF',
    primaryBg: '#2A2A2A',
    accent: '#C0C0C0',
    accentLight: '#222222',
    emergency: '#F5F5F5',
    emergencyBg: '#2A2A2A',
    background: '#0B0B0B',
    surface: '#181818',
    surfaceElevated: '#202020',
    card: '#171717',
    border: '#343434',
    borderLight: '#2A2A2A',
    textPrimary: '#F5F5F5',
    textSecondary: '#B6B6B6',
    textTertiary: '#8B8B8B',
    textInverse: '#0B0B0B',
    success: '#E0E0E0',
    warning: '#CFCFCF',
    error: '#FFFFFF',
    info: '#D8D8D8',
    chart1: '#2DD4BF',
    chart2: '#60A5FA',
    chart3: '#FBBF24',
    chart4: '#A78BFA',
    chart5: '#F87171',
    chart6: '#34D399',
    chart7: '#94A3B8',
    chart8: '#22D3EE',
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
    display: 'Poppins_600SemiBold',
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
