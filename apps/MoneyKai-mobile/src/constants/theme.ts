import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Color Palette ───────────────────────────────────────────────────────────
export const Colors = {
  light: {
    primary: '#111111',
    primaryLight: '#3A3A3A',
    primaryDark: '#000000',
    primaryBg: '#F2F2F2',
    accent: '#111111',
    accentLight: '#EFEFEF',
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
    success: '#111111',
    warning: '#5A5A5A',
    error: '#111111',
    info: '#3A3A3A',
    // Chart colors
    chart1: '#111111',
    chart2: '#2B2B2B',
    chart3: '#444444',
    chart4: '#5A5A5A',
    chart5: '#707070',
    chart6: '#8A8A8A',
    chart7: '#A3A3A3',
    chart8: '#BDBDBD',
    // Shadows
    shadowColor: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    glassBg: 'rgba(255, 255, 255, 0.88)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',
  },
  dark: {
    primary: '#F5F5F5',
    primaryLight: '#FFFFFF',
    primaryDark: '#CFCFCF',
    primaryBg: '#252525',
    accent: '#FFFFFF',
    accentLight: '#1D1D1D',
    emergency: '#F5F5F5',
    emergencyBg: '#2A2A2A',
    background: '#050505',
    surface: '#101010',
    surfaceElevated: '#171717',
    card: '#111111',
    border: '#303030',
    borderLight: '#222222',
    textPrimary: '#F5F5F5',
    textSecondary: '#C8C8C8',
    textTertiary: '#8F8F8F',
    textInverse: '#050505',
    success: '#FFFFFF',
    warning: '#D6D6D6',
    error: '#FFFFFF',
    info: '#E5E5E5',
    chart1: '#FFFFFF',
    chart2: '#E5E5E5',
    chart3: '#CFCFCF',
    chart4: '#B8B8B8',
    chart5: '#A3A3A3',
    chart6: '#8F8F8F',
    chart7: '#707070',
    chart8: '#5A5A5A',
    shadowColor: '#000000',
    overlay: 'rgba(0, 0, 0, 0.7)',
    glassBg: 'rgba(18, 18, 18, 0.9)',
    glassBorder: 'rgba(48, 48, 48, 0.65)',
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
