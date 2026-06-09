import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Color Palette ───────────────────────────────────────────────────────────
export const Colors = {
  light: {
    primary: '#2563EB',
    primaryLight: '#1D4ED8',
    primaryDark: '#1E3A8A',
    primaryBg: '#DBEAFE',
    accent: '#059669',
    accentLight: '#D1FAE5',
    emergency: '#DC2626',
    emergencyBg: '#FEE2E2',
    background: '#EEF2F7',
    surface: '#FFFFFF',
    surfaceElevated: '#F8FAFC',
    card: '#FFFFFF',
    border: '#CBD5E1',
    borderLight: '#E2E8F0',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textTertiary: '#64748B',
    textInverse: '#FFFFFF',
    success: '#047857',
    warning: '#B45309',
    error: '#DC2626',
    info: '#0369A1',
    // Chart colors
    chart1: '#2563EB',
    chart2: '#10B981',
    chart3: '#F59E0B',
    chart4: '#8B5CF6',
    chart5: '#EC4899',
    chart6: '#14B8A6',
    chart7: '#64748B',
    chart8: '#94A3B8',
    // Shadows
    shadowColor: '#000000',
    overlay: 'rgba(0, 0, 0, 0.5)',
    glassBg: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',
  },
  dark: {
    primary: '#7CB7FF',
    primaryLight: '#A8D0FF',
    primaryDark: '#4F9BF6',
    primaryBg: '#173B67',
    accent: '#4ADE80',
    accentLight: '#143F2B',
    emergency: '#FF9D9D',
    emergencyBg: '#471D1D',
    background: '#0A0D10',
    surface: '#15181D',
    surfaceElevated: '#20242B',
    card: '#171A20',
    border: '#3A404A',
    borderLight: '#2A3038',
    textPrimary: '#F7F9FC',
    textSecondary: '#D2D8E2',
    textTertiary: '#A5AFBE',
    textInverse: '#07111F',
    success: '#86EFAC',
    warning: '#FDE68A',
    error: '#FFB4B4',
    info: '#A8D0FF',
    chart1: '#7CB7FF',
    chart2: '#4ADE80',
    chart3: '#FBBF24',
    chart4: '#A78BFA',
    chart5: '#F472B6',
    chart6: '#2DD4BF',
    chart7: '#A5AFBE',
    chart8: '#D2D8E2',
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
