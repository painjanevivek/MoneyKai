import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { Motion } from '@/constants/theme';

/** One runtime decision for navigation and component motion. */
export function useAppMotion() {
  const reanimatedPreference = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(Boolean(reanimatedPreference));

  useEffect(() => {
    let active = true;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduceMotion(value);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return {
    reduceMotion,
    duration: reduceMotion ? Motion.reducedDuration : Motion.duration.standard,
    fastDuration: reduceMotion ? Motion.reducedDuration : Motion.duration.fast,
  };
}
