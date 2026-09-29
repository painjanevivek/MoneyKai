import React from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { BorderRadius, Colors, Typography } from '@/constants/theme';

const colors = Colors.light;
const routeDashes = Array.from({ length: 12 }, (_, index) => index);

export function RunawayRouteAnimation() {
  const initiallyReducedMotion = useReducedMotion();
  const [reduceMotion, setReduceMotion] = React.useState(initiallyReducedMotion);
  const coinFloat = useSharedValue(0);
  const receiptRun = useSharedValue(0.5);
  const blink = useSharedValue(1);

  React.useEffect(() => {
    let active = true;
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduceMotion(value);
    });
    return () => { active = false; listener.remove(); };
  }, []);

  React.useEffect(() => {
    cancelAnimation(coinFloat);
    cancelAnimation(receiptRun);
    cancelAnimation(blink);

    if (reduceMotion) {
      coinFloat.value = 0;
      receiptRun.value = 0.5;
      blink.value = 1;
      return;
    }

    coinFloat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 850, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    receiptRun.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1650, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 1650, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
    );
    blink.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1450 }),
        withTiming(0.08, { duration: 80 }),
        withTiming(1, { duration: 90 }),
        withTiming(1, { duration: 1850 }),
      ),
      -1,
    );

    return () => {
      cancelAnimation(coinFloat);
      cancelAnimation(receiptRun);
      cancelAnimation(blink);
    };
  }, [blink, coinFloat, receiptRun, reduceMotion]);

  const coinStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(coinFloat.value, [0, 1], [4, -11]) },
      { rotate: `${interpolate(coinFloat.value, [0, 1], [-5, 7])}deg` },
    ],
  }));
  const receiptStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(receiptRun.value, [0, 1], [-34, 34]) },
      { translateY: interpolate(receiptRun.value, [0, 0.5, 1], [0, -5, 0]) },
      { rotate: `${interpolate(receiptRun.value, [0, 0.5, 1], [-4, 4, -4])}deg` },
    ],
  }));
  const eyeStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.value }] }));

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="A goofy 404 with a wobbling coin and a runaway receipt"
      style={{ width: 294, height: 238, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          position: 'absolute', width: 244, height: 190, borderRadius: 95,
          backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.borderLight,
          transform: [{ rotate: '-5deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute', right: 19, top: 22, width: 30, height: 30,
          borderRadius: BorderRadius.full, backgroundColor: colors.surface,
          borderWidth: 1, borderColor: colors.border,
        }}
      />

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ width: 78, color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: 78, lineHeight: 82, letterSpacing: -7, textAlign: 'center' }}>4</Text>
        <Animated.View
          style={[
            coinStyle,
            {
              width: 74, height: 74, marginHorizontal: 1, borderRadius: BorderRadius.full,
              alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary,
              borderWidth: 7, borderColor: colors.surface, shadowColor: colors.shadowColor,
              shadowOpacity: 0.15, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6,
            },
          ]}
        >
          <View style={{ width: 49, height: 49, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' }}>
            <Text style={{ color: colors.textInverse, fontFamily: Typography.fontFamily.bold, fontSize: 37, lineHeight: 43 }}>0</Text>
          </View>
        </Animated.View>
        <Text style={{ width: 78, color: colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: 78, lineHeight: 82, letterSpacing: -7, textAlign: 'center' }}>4</Text>
      </View>

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', bottom: 33, left: 31, right: 31, height: 3, flexDirection: 'row', justifyContent: 'space-between' }}
      >
        {routeDashes.map((dash) => (
          <View key={dash} style={{ width: 11, height: 3, borderRadius: BorderRadius.full, backgroundColor: colors.border }} />
        ))}
      </View>

      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          receiptStyle,
          {
            position: 'absolute', bottom: 20, width: 60, height: 69, paddingTop: 9,
            paddingHorizontal: 8, alignItems: 'center', backgroundColor: colors.surface,
            borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.sm,
            shadowColor: colors.shadowColor, shadowOpacity: 0.12, shadowRadius: 9,
            shadowOffset: { width: 0, height: 5 }, elevation: 4,
          },
        ]}
      >
        <View style={{ width: '74%', height: 3, borderRadius: 2, backgroundColor: colors.borderLight }} />
        <View style={{ width: '52%', height: 3, marginTop: 5, borderRadius: 2, backgroundColor: colors.borderLight }} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 9 }}>
          <Animated.View style={[eyeStyle, { width: 6, height: 8, borderRadius: 4, backgroundColor: colors.textPrimary }]} />
          <Animated.View style={[eyeStyle, { width: 6, height: 8, borderRadius: 4, backgroundColor: colors.textPrimary }]} />
        </View>
        <View style={{ width: 14, height: 7, marginTop: 5, borderBottomWidth: 2, borderColor: colors.primary, borderRadius: BorderRadius.full }} />
        <View style={{ position: 'absolute', bottom: -7, left: 12, width: 3, height: 10, borderRadius: 2, backgroundColor: colors.textPrimary, transform: [{ rotate: '18deg' }] }} />
        <View style={{ position: 'absolute', bottom: -7, right: 12, width: 3, height: 10, borderRadius: 2, backgroundColor: colors.textPrimary, transform: [{ rotate: '-18deg' }] }} />
      </Animated.View>
    </View>
  );
}
