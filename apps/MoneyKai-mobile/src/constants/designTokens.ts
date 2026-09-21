import { Platform } from 'react-native';

export const BrandPalette = {
  ink: '#171A15',
  inkMuted: '#535B4F',
  inkSubtle: '#71796C',
  paper: '#F8F7F0',
  surface: '#FFFFFF',
  cream: '#F1EAD7',
  creamSoft: '#F6F1E4',
  lime: '#B8F25C',
  limeSoft: '#EAF8D3',
  limeStrong: '#557A18',
  limeDeep: '#314610',
  olive: '#667453',
  oliveSoft: '#E5EADD',
  line: '#D9DDCF',
  lineSoft: '#E9ECDF',
  white: '#FFFFFF',
  red: '#B4232C',
  redSoft: '#FCE8E9',
  amber: '#8B5E14',
  amberSoft: '#FFF1CF',
  blue: '#245DA8',
  blueSoft: '#E5EFFB',
  green: '#39733B',
  greenSoft: '#E4F2E2',
} as const;

export const SemanticColors = {
  primary: BrandPalette.limeStrong,
  primaryLight: BrandPalette.lime,
  primaryDark: BrandPalette.limeDeep,
  primaryBg: BrandPalette.limeSoft,
  action: BrandPalette.lime,
  actionPressed: '#A6DF4B',
  onAction: BrandPalette.ink,
  accent: BrandPalette.olive,
  accentLight: BrandPalette.oliveSoft,
  emergency: BrandPalette.red,
  emergencyBg: BrandPalette.redSoft,
  background: BrandPalette.paper,
  surface: BrandPalette.surface,
  surfaceElevated: BrandPalette.creamSoft,
  surfaceSupport: BrandPalette.cream,
  card: BrandPalette.surface,
  border: BrandPalette.line,
  borderLight: BrandPalette.lineSoft,
  textPrimary: BrandPalette.ink,
  textSecondary: BrandPalette.inkMuted,
  textTertiary: BrandPalette.inkSubtle,
  textInverse: BrandPalette.white,
  success: BrandPalette.green,
  successBg: BrandPalette.greenSoft,
  warning: BrandPalette.amber,
  warningBg: BrandPalette.amberSoft,
  error: BrandPalette.red,
  errorBg: BrandPalette.redSoft,
  info: BrandPalette.blue,
  infoBg: BrandPalette.blueSoft,
  focusRing: BrandPalette.limeDeep,
  chart1: BrandPalette.limeStrong,
  chart2: BrandPalette.blue,
  chart3: BrandPalette.amber,
  chart4: '#7558A8',
  chart5: BrandPalette.red,
  chart6: BrandPalette.green,
  chart7: BrandPalette.olive,
  chart8: '#3D7680',
  shadowColor: '#28311F',
  overlay: 'rgba(23, 26, 21, 0.58)',
  glassBg: 'rgba(255, 255, 255, 0.92)',
  glassBorder: 'rgba(102, 116, 83, 0.28)',
} as const;

const androidFont = (weight: 'regular' | 'medium') =>
  Platform.select({ android: weight === 'regular' ? 'sans-serif' : 'sans-serif-medium', default: 'System' }) ?? 'System';

export const TypeTokens = {
  fontFamily: {
    regular: androidFont('regular'),
    medium: androidFont('medium'),
    semiBold: androidFont('medium'),
    bold: androidFont('medium'),
    display: androidFont('medium'),
    mono: Platform.select({ android: 'monospace', ios: 'Menlo', default: 'monospace' }) ?? 'monospace',
  },
  fontSize: {
    xs: 12,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 34,
    '5xl': 42,
  },
  lineHeight: {
    xs: 16,
    sm: 18,
    base: 22,
    md: 24,
    lg: 27,
    xl: 30,
    '2xl': 34,
    '3xl': 38,
    '4xl': 44,
    '5xl': 52,
  },
  letterSpacing: {
    tight: -0.4,
    normal: 0,
    label: 0.2,
    eyebrow: 0.8,
  },
} as const;

export const SpaceTokens = {
  none: 0,
  xxs: 2,
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

export const ShapeTokens = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const ControlTokens = {
  height: { sm: 44, md: 48, lg: 56 },
  paddingX: { sm: 14, md: 18, lg: 24 },
  minTouchTarget: 44,
  focusRingWidth: 3,
  borderWidth: 1,
  disabledOpacity: 0.52,
  pressedOpacity: 0.86,
  pressedScale: 0.98,
} as const;

export const IconTokens = { xs: 16, sm: 20, md: 24, lg: 28, xl: 32 } as const;

export const MotionTokens = {
  duration: { instant: 0, fast: 120, standard: 180, deliberate: 240 },
  reducedDuration: 0,
  pressScale: ControlTokens.pressedScale,
  spring: { damping: 18, stiffness: 260, mass: 0.7 },
} as const;

export const ElevationTokens = {
  none: { shadowOpacity: 0, elevation: 0 },
  sm: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  md: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  lg: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 18, elevation: 5 },
  xl: { shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 8 },
} as const;

export const GlassTokens = {
  navigationOpacity: 0.92,
  fallbackColor: SemanticColors.glassBg,
  borderColor: SemanticColors.glassBorder,
  androidBlurMethod: 'dimezisBlurView',
} as const;
