import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useAppMotion } from '@/hooks/useAppMotion';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { hapticForSelection } from '@/services/hapticsService';

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  children: React.ReactNode;
  pressedScale?: number;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({
  children,
  disabled,
  onPressIn,
  onPressOut,
  onPress,
  haptic = true,
  pressedScale = 0.97,
  style,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const { reduceMotion } = useAppMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPress={(event) => {
        if (disabled || !onPress) return;
        if (haptic) void hapticForSelection();
        onPress(event);
      }}
      onPressIn={(event) => {
        if (!disabled && !reduceMotion) {
          cancelAnimation(scale);
          scale.value = withTiming(pressedScale, {
            duration: 65,
            easing: Easing.out(Easing.quad),
          });
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        cancelAnimation(scale);
        scale.value = reduceMotion
          ? 1
          : withTiming(1, {
              duration: 95,
              easing: Easing.out(Easing.cubic),
            });
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

export default PressableScale;
