import { StyleSheet } from 'react-native';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';

export const createAppScreenStyles = (colors: {
  background: string;
  card: string;
  surface: string;
  border: string;
  borderLight: string;
  primary: string;
  primaryBg: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  success: string;
  error: string;
}) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingTop: 0,
      paddingBottom: 100,
    },
    header: {
      marginBottom: Spacing.base,
    },
    title: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontFamily: Typography.fontFamily.display,
      fontSize: 28,
      letterSpacing: -0.7,
      lineHeight: 32,
    },
    subtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.md,
      lineHeight: 18,
      marginTop: Spacing.sm,
    },
    sectionTitle: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontFamily: Typography.fontFamily.display,
      fontSize: Typography.fontSize['2xl'],
      letterSpacing: -0.35,
      lineHeight: 25,
      marginBottom: Spacing.md,
    },
    panel: {
      backgroundColor: colors.card,
      borderColor: colors.borderLight,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      marginBottom: Spacing.base,
      padding: Spacing.lg,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.md,
      justifyContent: 'space-between',
    },
    muted: {
      color: colors.textSecondary,
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.md,
    },
    value: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Typography.fontSize.lg,
      lineHeight: 21,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.base,
    },
    chip: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      flexDirection: 'row',
      minHeight: 44,
      paddingHorizontal: Spacing.md,
    },
    chipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipText: {
      color: colors.textSecondary,
      fontFamily: Typography.fontFamily.medium,
      fontSize: Typography.fontSize.sm,
    },
    chipTextActive: {
      color: colors.textInverse,
    },
    emptyText: {
      color: colors.textSecondary,
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.base,
      lineHeight: Typography.lineHeight.base,
      textAlign: 'center',
    },
    divider: {
      backgroundColor: colors.borderLight,
      height: 1,
      marginVertical: Spacing.md,
    },
  });

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
