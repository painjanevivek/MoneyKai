import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
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
  const [isMounted, setIsMounted] = useState(visible);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [translateY] = useState(() => new Animated.Value(32));
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const closeButtonRef = useRef<any>(null);

  const animateIn = useCallback(() => {
    translateY.setValue(reduceMotion ? 0 : 32);
    backdropOpacity.setValue(reduceMotion ? 1 : 0);

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: reduceMotion ? 1 : 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 10,
      }),
    ]).start();
  }, [backdropOpacity, reduceMotion, translateY]);

  const animateOut = useCallback(
    (onComplete: () => void) => {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: reduceMotion ? 1 : 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: reduceMotion ? 0 : 96,
          duration: reduceMotion ? 1 : 150,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          onComplete();
        }
      });
    },
    [backdropOpacity, reduceMotion, translateY]
  );

  useEffect(() => {
    let isActive = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((isEnabled) => {
        if (isActive) {
          setReduceMotion(isEnabled);
        }
      })
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);

    return () => {
      isActive = false;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (visible && !isMounted) {
      const animationFrame = requestAnimationFrame(() => setIsMounted(true));
      return () => cancelAnimationFrame(animationFrame);
    }

    if (!visible && isMounted) {
      animateOut(() => setIsMounted(false));
    }
  }, [visible, isMounted, animateOut]);

  useEffect(() => {
    if (!visible || !isMounted) return;

    const animationFrame = requestAnimationFrame(() => {
      animateIn();
      if (closeButtonRef.current?.focus) {
        closeButtonRef.current.focus();
      }
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [visible, isMounted, animateIn]);

  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }

    return;
  }, [visible, onClose]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
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
      }),
    [animateIn, onClose, translateY]
  );

  return (
    <Modal
      transparent
      visible={isMounted}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={{
            ...StyleSheet.absoluteFill,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            opacity: backdropOpacity,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close modal"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

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
          {...panResponder.panHandlers}
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
            showsVerticalScrollIndicator={true}
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
