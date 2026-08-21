import React from 'react';
import { Animated, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

interface Props {
  children: React.ReactNode;
  orderKey: number;
  style?: StyleProp<ViewStyle>;
}

export function DashboardMotionItem({ children, orderKey, style }: Props) {
  const reducedMotion = useReducedMotion();
  const [scale] = React.useState(() => new Animated.Value(1));
  const [translateY] = React.useState(() => new Animated.Value(0));
  const [opacity] = React.useState(() => new Animated.Value(1));
  const useNativeDriver = Platform.OS !== 'web';

  React.useEffect(() => {
    if (reducedMotion) {
      scale.setValue(1);
      translateY.setValue(0);
      opacity.setValue(1);
      return;
    }
    scale.setValue(0.992);
    translateY.setValue(7);
    opacity.setValue(0.78);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 92, friction: 10, useNativeDriver }),
      Animated.spring(translateY, { toValue: 0, tension: 88, friction: 11, useNativeDriver }),
      Animated.timing(opacity, { toValue: 1, duration: 170, useNativeDriver }),
    ]).start();
  }, [opacity, orderKey, reducedMotion, scale, translateY, useNativeDriver]);

  const animateScale = (toValue: number) => {
    if (reducedMotion) return;
    Animated.spring(scale, { toValue, tension: 130, friction: 12, useNativeDriver }).start();
  };

  return (
    <Animated.View
      onPointerEnter={() => animateScale(1.006)}
      onPointerLeave={() => animateScale(1)}
      style={[style, { opacity, transform: [{ translateY }, { scale }] }]}
    >
      {children}
    </Animated.View>
  );
}
