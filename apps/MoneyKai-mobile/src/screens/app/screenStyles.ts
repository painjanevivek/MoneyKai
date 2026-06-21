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
      paddingTop: Spacing.sm,
      paddingBottom: Spacing['2xl'],
    },
    header: {
      marginBottom: Spacing.base,
    },
    title: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize['2xl'],
      lineHeight: 34,
    },
    subtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.fontSize.base,
      lineHeight: Typography.lineHeight.base,
      marginTop: 4,
    },
    sectionTitle: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.fontSize.lg,
      lineHeight: 24,
      marginBottom: Spacing.md,
    },
    panel: {
      backgroundColor: colors.card,
      borderColor: colors.borderLight,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      marginBottom: Spacing.base,
      padding: Spacing.base,
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
      fontSize: Typography.fontSize.sm,
    },
    value: {
      color: colors.textPrimary,
      flexShrink: 1,
      fontFamily: Typography.fontFamily.semiBold,
      fontSize: Typography.fontSize.lg,
      lineHeight: 24,
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
      minHeight: 36,
      paddingHorizontal: Spacing.md,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
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
