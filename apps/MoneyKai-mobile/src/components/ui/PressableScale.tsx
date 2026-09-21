import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { ComponentTokens, Motion } from '@/constants/theme';
import { useAppMotion } from '@/hooks/useAppMotion';

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  children: React.ReactNode;
  pressedScale?: number;
  style?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({
  children,
  disabled,
  onPressIn,
  onPressOut,
  pressedScale = ComponentTokens.pressedScale,
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
      onPressIn={(event) => {
        if (!disabled) {
          scale.value = reduceMotion ? 1 : withSpring(pressedScale, Motion.spring);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = reduceMotion ? 1 : withSpring(1, Motion.spring);
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

export default PressableScale;
