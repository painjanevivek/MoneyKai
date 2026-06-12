import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Color Palette ───────────────────────────────────────────────────────────
export const Colors = {
  light: {
    primary: '#EAF6F0',
    primaryLight: '#FFFFFF',
    primaryDark: '#BFD2C8',
    primaryBg: '#18241F',
    accent: '#B8D7C2',
    accentLight: '#22342D',
    emergency: '#E58F8F',
    emergencyBg: '#321B1B',
    background: '#050706',
    surface: '#0B0E0D',
    surfaceElevated: '#111716',
    card: '#0E1311',
    border: '#3A453F',
    borderLight: '#202923',
    textPrimary: '#F7FAF8',
    textSecondary: '#C6D0CA',
    textTertiary: '#7F8A84',
    textInverse: '#07100C',
    success: '#9BD9AE',
    warning: '#D6BE78',
    error: '#E58F8F',
    info: '#DCE8E2',
    // Chart colors
    chart1: '#EAF6F0',
    chart2: '#9BD9AE',
    chart3: '#D6BE78',
    chart4: '#BFD2C8',
    chart5: '#C9B7A0',
    chart6: '#8DB6A0',
    chart7: '#7F8A84',
    chart8: '#C6D0CA',
    // Shadows
    shadowColor: '#000000',
    overlay: 'rgba(0, 0, 0, 0.72)',
    glassBg: 'rgba(12, 18, 15, 0.78)',
    glassBorder: 'rgba(234, 246, 240, 0.14)',
  },
  dark: {
    primary: '#EAF6F0',
    primaryLight: '#FFFFFF',
    primaryDark: '#BFD2C8',
    primaryBg: '#17221D',
    accent: '#A9CFB8',
    accentLight: '#1F3028',
    emergency: '#E59090',
    emergencyBg: '#301A1A',
    background: '#030504',
    surface: '#080B0A',
    surfaceElevated: '#101614',
    card: '#0C1110',
    border: '#3A453F',
    borderLight: '#1F2823',
    textPrimary: '#F8FBF9',
    textSecondary: '#C2CCC6',
    textTertiary: '#7D8782',
    textInverse: '#06100C',
    success: '#94D7A9',
    warning: '#D4BB75',
    error: '#E59090',
    info: '#DCE8E2',
    chart1: '#EAF6F0',
    chart2: '#94D7A9',
    chart3: '#D4BB75',
    chart4: '#BFD2C8',
    chart5: '#C7B69F',
    chart6: '#87B29A',
    chart7: '#7D8782',
    chart8: '#C2CCC6',
    shadowColor: '#000000',
    overlay: 'rgba(0, 0, 0, 0.78)',
    glassBg: 'rgba(10, 16, 13, 0.82)',
    glassBorder: 'rgba(234, 246, 240, 0.14)',
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
