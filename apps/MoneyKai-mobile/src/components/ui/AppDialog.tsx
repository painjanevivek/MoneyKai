import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';

type DialogAction = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
};

type AppDialogProps = {
  visible: boolean;
  eyebrow?: string;
  title: string;
  message: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  confirmAction: DialogAction;
  cancelAction?: DialogAction;
  onRequestClose: () => void;
  children?: React.ReactNode;
};

export function AppDialog({
  visible,
  eyebrow,
  title,
  message,
  icon = 'information-outline',
  confirmAction,
  cancelAction,
  onRequestClose,
  children,
}: AppDialogProps) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [opacity] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(0.96));
  const [translateY] = useState(() => new Animated.Value(14));
  const dialogWidth = Math.min(width - Spacing.xl * 2, 420);

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 90,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 90,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, translateY]);

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.96);
      translateY.setValue(14);
      return;
    }

    requestAnimationFrame(animateIn);
  }, [animateIn, opacity, scale, translateY, visible]);

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onRequestClose}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
          onPress={onRequestClose}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.72)' : 'rgba(17, 17, 17, 0.42)',
          }}
        />

        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={title}
          style={{
            width: dialogWidth,
            borderRadius: BorderRadius.xl,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.borderLight,
            padding: Spacing.lg,
            opacity,
            transform: [{ scale }, { translateY }],
            ...Shadows.xl,
            shadowColor: colors.shadowColor,
            elevation: 18,
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: Spacing.lg,
              right: Spacing.lg,
              height: 3,
              borderBottomLeftRadius: BorderRadius.full,
              borderBottomRightRadius: BorderRadius.full,
              backgroundColor: colors.primary,
              opacity: isDark ? 0.9 : 0.75,
            }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: BorderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primaryBg,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              {!!eyebrow && (
                <Text
                  style={{
                    fontSize: Typography.fontSize.xs,
                    lineHeight: Typography.lineHeight.xs,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: colors.textTertiary,
                    textTransform: 'uppercase',
                  }}
                >
                  {eyebrow}
                </Text>
              )}
              <Text
                style={{
                  marginTop: eyebrow ? 3 : 0,
                  fontSize: Typography.fontSize.xl,
                  lineHeight: Typography.lineHeight.xl,
                  fontFamily: Typography.fontFamily.display,
                  color: colors.textPrimary,
                }}
              >
                {title}
              </Text>
            </View>
          </View>

          <Text
            style={{
              marginTop: Spacing.md,
              fontSize: Typography.fontSize.base,
              lineHeight: Typography.lineHeight.base,
              color: colors.textSecondary,
            }}
          >
            {message}
          </Text>

          {children ? <View style={{ marginTop: Spacing.md }}>{children}</View> : null}

          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg }}>
            {cancelAction ? (
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.78}
                onPress={cancelAction.onPress}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: BorderRadius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: Spacing.xs,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: Spacing.md,
                }}
              >
                {cancelAction.icon ? <MaterialCommunityIcons name={cancelAction.icon} size={18} color={colors.textSecondary} /> : null}
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.86}
                  style={{
                    fontSize: Typography.fontSize.sm,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: colors.textSecondary,
                  }}
                >
                  {cancelAction.label}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.82}
              onPress={confirmAction.onPress}
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: BorderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: Spacing.xs,
                backgroundColor: colors.primary,
                borderWidth: 1,
                borderColor: colors.primary,
                paddingHorizontal: Spacing.md,
              }}
            >
              {confirmAction.icon ? <MaterialCommunityIcons name={confirmAction.icon} size={18} color={colors.textInverse} /> : null}
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.86}
                style={{
                  fontSize: Typography.fontSize.sm,
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.textInverse,
                }}
              >
                {confirmAction.label}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default AppDialog;
