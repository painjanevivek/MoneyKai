import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

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
  pressedScale = 0.97,
  style,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) {
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
        scale.value = withTiming(1, {
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
