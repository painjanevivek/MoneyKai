import type { ColorScheme } from '../../constants/theme';

export const PRIMARY_TABS = [
  { route: 'Home', label: 'Home', icon: 'home-outline' },
  { route: 'Transactions', label: 'Transactions', icon: 'swap-horizontal' },
  { route: 'Add', label: 'Add', icon: 'plus' },
  { route: 'Budget', label: 'Budget', icon: 'wallet-outline' },
  { route: 'More', label: 'More', icon: 'more-horizontal' },
] as const;

export type FeedbackTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'offline';
export type ScreenStateKind = 'loading' | 'empty' | 'offline' | 'error' | 'conflict' | 'success' | 'neutral';

export const SCREEN_STATE_DEFAULTS: Record<ScreenStateKind, { icon: string; tone: FeedbackTone }> = {
  loading: { icon: 'refresh', tone: 'info' },
  empty: { icon: 'inbox-outline', tone: 'neutral' },
  offline: { icon: 'cloud-off-outline', tone: 'offline' },
  error: { icon: 'alert-circle-outline', tone: 'danger' },
  conflict: { icon: 'source-branch', tone: 'warning' },
  success: { icon: 'check-circle-outline', tone: 'success' },
  neutral: { icon: 'information-outline', tone: 'neutral' },
};

export function getFeedbackPalette(colors: ColorScheme, tone: FeedbackTone) {
  switch (tone) {
    case 'info':
      return { foreground: colors.info, background: colors.infoBg, border: colors.info };
    case 'success':
      return { foreground: colors.success, background: colors.successBg, border: colors.success };
    case 'warning':
      return { foreground: colors.warning, background: colors.warningBg, border: colors.warning };
    case 'danger':
      return { foreground: colors.error, background: colors.errorBg, border: colors.error };
    case 'offline':
      return { foreground: colors.warning, background: colors.surfaceSupport, border: colors.warning };
    default:
      return { foreground: colors.textSecondary, background: colors.surfaceElevated, border: colors.border };
  }
}
