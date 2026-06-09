import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
}

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
}) => {
  const { colors } = useTheme();
  const [translateY] = useState(() => new Animated.Value(24));
  const closeButtonRef = useRef<any>(null);

  const animateIn = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 70,
      friction: 10,
    }).start();
  }, [translateY]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(24);
      requestAnimationFrame(() => {
        animateIn();
        if (closeButtonRef.current?.focus) {
          closeButtonRef.current.focus();
        }
      });
    }
  }, [visible, translateY, animateIn]);

  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    if (
      typeof window !== 'undefined' &&
      typeof window.addEventListener === 'function' &&
      typeof window.removeEventListener === 'function'
    ) {
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }

    return;
  }, [visible, onClose]);

  const panResponder = useMemo(
    () => {
      if (typeof PanResponder?.create !== 'function') {
        return null;
      }

      return PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 90) {
            onClose();
            return;
          }
          animateIn();
        },
      });
    },
    [animateIn, onClose, translateY]
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close modal"
          onPress={onClose}
          style={{
            ...StyleSheet.absoluteFill,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
          }}
        />

        <Animated.View
          style={[
            {
              maxHeight,
              backgroundColor: colors.card,
              borderTopLeftRadius: BorderRadius.xl,
              borderTopRightRadius: BorderRadius.xl,
              paddingHorizontal: Spacing.xl,
              paddingTop: Spacing.sm,
              paddingBottom: Spacing.xl,
              ...Shadows.lg,
              shadowColor: colors.shadowColor,
              transform: [{ translateY }],
            },
            contentStyle,
          ]}
          {...(panResponder?.panHandlers ?? {})}
          accessibilityLabel={title}
          accessibilityViewIsModal
        >
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

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: subtitle ? Spacing.sm : Spacing.md }}>
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
