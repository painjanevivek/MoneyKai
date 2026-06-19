import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Shadows, Spacing, Typography } from '../../constants/theme';

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
}) => {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isSideSheet = presentation === 'side';
  const sideSheetWidth = Math.min(width * 0.86, 380);
  const sideSheetHiddenOffset = -sideSheetWidth - 24;
  const sideSheetTopOffset = isSideSheet ? insets.top + Spacing.xs : 0;
  const sideSheetHeight = Math.max(320, height - sideSheetTopOffset);
  const [translateY] = useState(() => new Animated.Value(24));
  const [translateX] = useState(() => new Animated.Value(-400));
  const closeButtonRef = useRef<any>(null);

  const animateIn = useCallback(() => {
    Animated.spring(isSideSheet ? translateX : translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 70,
      friction: 10,
    }).start();
  }, [isSideSheet, translateX, translateY]);

  useEffect(() => {
    if (visible) {
      if (isSideSheet) {
        translateX.setValue(sideSheetHiddenOffset);
      } else {
        translateY.setValue(24);
      }
      requestAnimationFrame(() => {
        animateIn();
        if (closeButtonRef.current?.focus) {
          closeButtonRef.current.focus();
        }
      });
    }
  }, [visible, isSideSheet, sideSheetHiddenOffset, translateX, translateY, animateIn]);

  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (event: BrowserKeyEventLike) => {
      if (event.key === 'Escape') {
        event.preventDefault?.();
        onClose();
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
  }, [visible, onClose]);

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
              onClose();
              return;
            }
            animateIn();
            return;
          }

          if (gestureState.dy > 90) {
            onClose();
            return;
          }
          animateIn();
        },
      });
    },
    [animateIn, isSideSheet, onClose, translateX, translateY]
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          justifyContent: isSideSheet ? 'flex-start' : 'flex-end',
          alignItems: isSideSheet ? 'flex-start' : 'stretch',
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close modal"
          onPress={onClose}
          style={{
            ...{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
          }}
        />

        <Animated.View
          onStartShouldSetResponder={() => true}
          style={[
            {
              width: isSideSheet ? sideSheetWidth : undefined,
              height: isSideSheet ? sideSheetHeight : undefined,
              maxHeight: isSideSheet ? sideSheetHeight : maxHeight,
              backgroundColor: colors.card,
              borderTopLeftRadius: isSideSheet ? 0 : BorderRadius.xl,
              borderTopRightRadius: BorderRadius.xl,
              borderBottomRightRadius: isSideSheet ? BorderRadius.xl : 0,
              paddingHorizontal: Spacing.xl,
              paddingTop: isSideSheet ? Spacing.lg : Spacing.sm,
              paddingBottom: Spacing.xl + (isSideSheet ? insets.bottom : 0),
              marginTop: sideSheetTopOffset,
              ...Shadows.lg,
              shadowColor: colors.shadowColor,
              zIndex: 1,
              elevation: 12,
              transform: isSideSheet ? [{ translateX }] : [{ translateY }],
            },
            contentStyle,
          ]}
          {...(panResponder?.panHandlers ?? {})}
          accessibilityLabel={title}
          accessibilityViewIsModal
        >
          {!isSideSheet && (
            <View
              style={{
                alignSelf: 'center',
                width: 44,
                height: 5,
                borderRadius: 999,
                backgroundColor: colors.border,
                marginBottom: Spacing.md,
              }}
            />
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
                  fontSize: Typography.fontSize.lg,
                  fontFamily: Typography.fontFamily.semiBold,
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
              onPress={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <MaterialCommunityIcons name="close" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: footer ? Spacing.md : 0 }}
          >
            {children}
          </ScrollView>

          {footer}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ModalSheet;
