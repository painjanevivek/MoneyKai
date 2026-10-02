import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

/** Keeps native navigation in sync when accessibility preferences change. */
export function useAppMotion() {
  const initialReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = useState(initialReducedMotion);
  useEffect(() => {
    let active = true;
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduceMotion(value);
    });
    return () => { active = false; listener.remove(); };
  }, []);
  return { reduceMotion, duration: reduceMotion ? 0 : 220 };
}
