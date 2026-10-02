import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, KeyboardAvoidingView, Platform, PanResponder, Pressable, ScrollView, TouchableOpacity, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon } from './AppIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppMotion } from '../../hooks/useAppMotion';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '../../constants/theme';
import { useExpandableSheet } from './useExpandableSheet';

interface ModalSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: number;
  contentStyle?: ViewStyle;
  presentation?: 'bottom' | 'side';
  expandable?: boolean;
}

type BrowserKeyEventLike = {
  key?: string;
  preventDefault?: () => void;
};

type BrowserWindowLike = {
  addEventListener: (eventName: string, handler: (event: BrowserKeyEventLike) => void) => void;
  removeEventListener: (eventName: string, handler: (event: BrowserKeyEventLike) => void) => void;
};

/**
 * A reusable bottom-sheet style modal with:
 * - close button
 * - scrim dismiss
 * - Escape-key dismiss on web
 * - swipe-down dismiss
 */
export const ModalSheet: React.FC<ModalSheetProps> = ({
  visible,
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxHeight = 720,
  contentStyle,
  presentation = 'bottom',
  expandable = true,
}) => {
  const { colors } = useTheme();
  const { reduceMotion } = useAppMotion();
  const { width, height } = useWindowDimensions();
  const [availableHeight, setAvailableHeight] = useState(height);
  const insets = useSafeAreaInsets();
  const isSideSheet = presentation === 'side';
  const canExpand = expandable && !isSideSheet;
  const sideSheetWidth = Math.min(width * 0.86, 380);
  const sideSheetHiddenOffset = -sideSheetWidth - 24;
  const sideSheetTopOffset = isSideSheet ? insets.top + Spacing.xs : 0;
  const sideSheetHeight = Math.max(0, availableHeight - sideSheetTopOffset);
  const bottomSheetHiddenOffset = height + insets.bottom;
  const [translateY] = useState(() => new Animated.Value(bottomSheetHiddenOffset));
  const [translateX] = useState(() => new Animated.Value(-400));
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const closeButtonRef = useRef<any>(null);
  const closingRef = useRef(false);

  const animateIn = useCallback(() => {
    if (reduceMotion) {
      (isSideSheet ? translateX : translateY).setValue(0);
      return;
    }
    Animated.spring(isSideSheet ? translateX : translateY, {
      toValue: 0,
      useNativeDriver: !canExpand,
      tension: 82,
      friction: 12,
    }).start();
  }, [canExpand, isSideSheet, reduceMotion, translateX, translateY]);

  const dismiss = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (reduceMotion) {
      onClose();
      return;
    }
    Animated.parallel([
      Animated.timing(isSideSheet ? translateX : translateY, {
        toValue: isSideSheet ? sideSheetHiddenOffset : bottomSheetHiddenOffset,
        duration: 260,
        useNativeDriver: !canExpand,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  }, [backdropOpacity, bottomSheetHiddenOffset, canExpand, isSideSheet, onClose, reduceMotion, sideSheetHiddenOffset, translateX, translateY]);

  const expandingSheet = useExpandableSheet({
    enabled: canExpand, visible, fullHeight: Math.max(1, availableHeight), translateY, reduceMotion, dismiss,
  });
  const resized = canExpand && expandingSheet.resized;
  const topRadius = resized
    ? expandingSheet.expansion.interpolate({ inputRange: [0, 1], outputRange: [BorderRadius.xl, 0] })
    : BorderRadius.xl;
  const topPadding = resized
    ? expandingSheet.expansion.interpolate({ inputRange: [0, 1], outputRange: [Spacing.sm, Spacing.sm + insets.top] })
    : Spacing.sm;

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      backdropOpacity.setValue(0);
      if (isSideSheet) {
        translateX.setValue(sideSheetHiddenOffset);
      } else {
        translateY.setValue(bottomSheetHiddenOffset);
      }
      const frame = requestAnimationFrame(() => {
        animateIn();
        if (reduceMotion) {
          backdropOpacity.setValue(1);
        } else {
          Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
        }
        if (closeButtonRef.current?.focus) {
          closeButtonRef.current.focus();
        }
      });
      return () => cancelAnimationFrame(frame);
    }
    return;
  }, [visible, isSideSheet, sideSheetHiddenOffset, bottomSheetHiddenOffset, translateX, translateY, backdropOpacity, animateIn, reduceMotion]);

  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (event: BrowserKeyEventLike) => {
      if (event.key === 'Escape') {
        event.preventDefault?.();
        dismiss();
      }
    };

    const browserWindow = globalThis as typeof globalThis & Partial<BrowserWindowLike>;

    if (
      typeof browserWindow.addEventListener === 'function' &&
      typeof browserWindow.removeEventListener === 'function'
    ) {
      browserWindow.addEventListener('keydown', onKeyDown);
      return () => browserWindow.removeEventListener?.('keydown', onKeyDown);
    }

    return;
  }, [visible, dismiss]);

  const panResponder = useMemo(
    () => {
      if (typeof PanResponder?.create !== 'function') {
        return null;
      }

      return PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (isSideSheet) {
            return gestureState.dx < -8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
          }

          return gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        },
        onPanResponderGrant: () => {
          (isSideSheet ? translateX : translateY).stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          if (isSideSheet) {
            if (gestureState.dx < 0) {
              translateX.setValue(gestureState.dx);
            }
            return;
          }

          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (isSideSheet) {
            if (gestureState.dx < -80) {
              dismiss();
              return;
            }
            animateIn();
            return;
          }

          if (gestureState.dy > 90 || gestureState.vy > 0.65) {
            dismiss();
            return;
          }
          animateIn();
        },
        onPanResponderTerminate: animateIn,
      });
    },
    [animateIn, dismiss, isSideSheet, translateX, translateY]
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        onLayout={(event) => setAvailableHeight(event.nativeEvent.layout.height)}
        style={{
          flex: 1,
          justifyContent: isSideSheet ? 'flex-start' : 'flex-end',
          alignItems: isSideSheet ? 'flex-start' : 'stretch',
        }}
      >
        <Animated.View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.overlay, opacity: backdropOpacity }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close modal"
            onPress={dismiss}
            style={{ flex: 1 }}
          />
        </Animated.View>

        <Animated.View
          onLayout={expandingSheet.onLayout}
          style={[
            {
              width: isSideSheet ? sideSheetWidth : undefined,
              height: isSideSheet ? sideSheetHeight : resized ? expandingSheet.sheetHeight : undefined,
              maxHeight: isSideSheet ? sideSheetHeight : resized ? availableHeight : Math.min(maxHeight, Math.max(200, availableHeight - insets.top - Spacing.base)),
              backgroundColor: colors.card,
              borderTopLeftRadius: isSideSheet ? 0 : topRadius,
              borderTopRightRadius: topRadius,
              borderBottomRightRadius: isSideSheet ? BorderRadius.xl : 0,
              paddingHorizontal: Spacing.xl,
              paddingTop: isSideSheet ? Spacing.lg : topPadding,
              paddingBottom: Spacing.base + insets.bottom,
              marginTop: sideSheetTopOffset,
              ...Shadows.lg,
              shadowColor: colors.shadowColor,
              zIndex: 1,
              elevation: 12,
              transform: isSideSheet ? [{ translateX }] : [{ translateY }],
            },
            contentStyle,
          ]}
          {...(isSideSheet ? panResponder?.panHandlers ?? {} : {})}
          accessibilityLabel={title}
          accessibilityViewIsModal
        >
          {!isSideSheet && (
            <View
              {...(canExpand ? expandingSheet.panHandlers : panResponder?.panHandlers ?? {})}
              collapsable={false}
              accessible={canExpand}
              accessibilityRole={canExpand ? 'adjustable' : undefined}
              accessibilityLabel={canExpand ? `${title} drag handle` : undefined}
              accessibilityHint={canExpand ? 'Drag up to expand to full screen. Drag down to close, or use Back.' : undefined}
              accessibilityValue={canExpand ? { min: 0, max: 1, now: expandingSheet.expanded ? 1 : 0, text: expandingSheet.expanded ? 'Full screen' : 'Partially expanded' } : undefined}
              accessibilityActions={canExpand ? [{ name: 'increment', label: 'Expand to full screen' }, { name: 'decrement', label: 'Close' }, { name: 'escape', label: 'Close' }] : undefined}
              onAccessibilityAction={canExpand ? (event) => {
                if (event.nativeEvent.actionName === 'increment') expandingSheet.expand();
                else dismiss();
              } : undefined}
              style={{
                alignSelf: canExpand ? 'stretch' : 'center',
                alignItems: 'center',
                justifyContent: canExpand ? 'center' : 'flex-start',
                width: canExpand ? undefined : 88,
                height: canExpand ? 44 : 28,
              }}
            >
              <View pointerEvents="none" style={{ width: 44, height: 5, borderRadius: 999, backgroundColor: colors.border }} />
            </View>
          )}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginBottom: subtitle ? Spacing.sm : Spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: Typography.fontSize['3xl'],
                  fontFamily: Typography.fontFamily.display,
                  color: colors.textPrimary,
                }}
              >
                {title}
              </Text>
              {!!subtitle && (
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: Typography.fontSize.xs,
                    color: colors.textSecondary,
                    lineHeight: 18,
                  }}
                >
                  {subtitle}
                </Text>
              )}
            </View>

            <TouchableOpacity
              ref={closeButtonRef}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={dismiss}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <AppIcon name="close" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={[{ flexShrink: 1 }, resized && { flexGrow: 1 }]}
            contentContainerStyle={{ paddingBottom: footer ? Spacing.lg : 0 }}
          >
            {children}
          </ScrollView>

          {footer}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ModalSheet;
