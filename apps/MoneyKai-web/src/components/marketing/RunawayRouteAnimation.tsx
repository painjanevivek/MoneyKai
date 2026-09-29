import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { BorderRadius, type ColorScheme, Typography } from '@/constants/theme';
import { useReducedMotion } from '@/components/dashboard/analytics/useReducedMotion';

type RunawayRouteAnimationProps = {
  colors: ColorScheme;
  compact: boolean;
};

const routeDashes = Array.from({ length: 12 }, (_, index) => index);

export function RunawayRouteAnimation({ colors, compact }: RunawayRouteAnimationProps) {
  const reducedMotion = useReducedMotion();
  const coinFloat = useSharedValue(0);
  const receiptRun = useSharedValue(0);
  const blink = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      coinFloat.value = 0;
      receiptRun.value = 0.5;
      blink.value = 1;
      return;
    }

    coinFloat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 850, easing: Easing.inOut(Easing.quad) })
      ),
      -1
    );
    receiptRun.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1650, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 1650, easing: Easing.inOut(Easing.cubic) })
      ),
      -1
    );
    blink.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1450 }),
        withTiming(0.08, { duration: 80 }),
        withTiming(1, { duration: 90 }),
        withTiming(1, { duration: 1850 })
      ),
      -1
    );

    return () => {
      cancelAnimation(coinFloat);
      cancelAnimation(receiptRun);
      cancelAnimation(blink);
    };
  }, [blink, coinFloat, receiptRun, reducedMotion]);

  const coinStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(coinFloat.value, [0, 1], [4, -11]) },
      { rotate: `${interpolate(coinFloat.value, [0, 1], [-5, 7])}deg` },
    ],
  }));

  const receiptStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(receiptRun.value, [0, 1], compact ? [-34, 34] : [-62, 62]) },
      { translateY: interpolate(receiptRun.value, [0, 0.5, 1], [0, -5, 0]) },
      { rotate: `${interpolate(receiptRun.value, [0, 0.5, 1], [-4, 4, -4])}deg` },
    ],
  }));

  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));

  const sceneWidth = compact ? 294 : 476;
  const sceneHeight = compact ? 238 : 330;
  const numberSize = compact ? 78 : 122;
  const coinSize = compact ? 74 : 108;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="A goofy animated 404 with a wobbling coin and a runaway receipt"
      style={{
        width: sceneWidth,
        height: sceneHeight,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: compact ? 244 : 390,
          height: compact ? 190 : 270,
          borderRadius: compact ? 95 : 135,
          backgroundColor: colors.primaryBg,
          borderWidth: 1,
          borderColor: colors.borderLight,
          transform: [{ rotate: '-5deg' }],
        }}
      />

      <View
        style={{
          position: 'absolute',
          right: compact ? 19 : 36,
          top: compact ? 22 : 34,
          width: compact ? 30 : 42,
          height: compact ? 30 : 42,
          borderRadius: BorderRadius.full,
          backgroundColor: colors.accentLight,
          borderWidth: 1,
          borderColor: colors.borderLight,
        }}
      />

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text
          style={{
            width: compact ? 78 : 126,
            color: colors.textPrimary,
            fontFamily: Typography.fontFamily.bold,
            fontSize: numberSize,
            lineHeight: numberSize * 1.05,
            letterSpacing: compact ? -7 : -12,
            textAlign: 'center',
          }}
        >
          4
        </Text>

        <Animated.View
          style={[
            coinStyle,
            {
              width: coinSize,
              height: coinSize,
              marginHorizontal: compact ? 1 : 4,
              borderRadius: BorderRadius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary,
              borderWidth: compact ? 7 : 9,
              borderColor: colors.surface,
              shadowColor: colors.shadowColor,
              shadowOpacity: 0.15,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
              elevation: 6,
            },
          ]}
        >
          <View
            style={{
              width: coinSize - (compact ? 25 : 34),
              height: coinSize - (compact ? 25 : 34),
              borderRadius: BorderRadius.full,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.6)',
            }}
          >
            <Text
              style={{
                color: colors.textInverse,
                fontFamily: Typography.fontFamily.bold,
                fontSize: compact ? 37 : 54,
                lineHeight: compact ? 43 : 60,
              }}
            >
              0
            </Text>
          </View>
        </Animated.View>

        <Text
          style={{
            width: compact ? 78 : 126,
            color: colors.textPrimary,
            fontFamily: Typography.fontFamily.bold,
            fontSize: numberSize,
            lineHeight: numberSize * 1.05,
            letterSpacing: compact ? -7 : -12,
            textAlign: 'center',
          }}
        >
          4
        </Text>
      </View>

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          bottom: compact ? 33 : 52,
          left: compact ? 31 : 55,
          right: compact ? 31 : 55,
          height: 3,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        {routeDashes.map((dash) => (
          <View
            key={dash}
            style={{
              width: compact ? 11 : 17,
              height: 3,
              borderRadius: BorderRadius.full,
              backgroundColor: colors.border,
            }}
          />
        ))}
      </View>

      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          receiptStyle,
          {
            position: 'absolute',
            bottom: compact ? 20 : 32,
            width: compact ? 60 : 76,
            height: compact ? 69 : 85,
            paddingTop: compact ? 9 : 12,
            paddingHorizontal: compact ? 8 : 10,
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: BorderRadius.sm,
            shadowColor: colors.shadowColor,
            shadowOpacity: 0.12,
            shadowRadius: 9,
            shadowOffset: { width: 0, height: 5 },
            elevation: 4,
          },
        ]}
      >
        <View style={{ width: '74%', height: 3, borderRadius: 2, backgroundColor: colors.primaryBg }} />
        <View style={{ width: '52%', height: 3, marginTop: 5, borderRadius: 2, backgroundColor: colors.primaryBg }} />
        <View style={{ flexDirection: 'row', gap: compact ? 8 : 11, marginTop: compact ? 9 : 12 }}>
          <Animated.View style={[eyeStyle, { width: 6, height: 8, borderRadius: 4, backgroundColor: colors.textPrimary }]} />
          <Animated.View style={[eyeStyle, { width: 6, height: 8, borderRadius: 4, backgroundColor: colors.textPrimary }]} />
        </View>
        <View
          style={{
            width: compact ? 14 : 18,
            height: compact ? 7 : 9,
            marginTop: 5,
            borderBottomWidth: 2,
            borderColor: colors.primary,
            borderRadius: BorderRadius.full,
          }}
        />
        <View style={{ position: 'absolute', bottom: -7, left: 12, width: 3, height: 10, borderRadius: 2, backgroundColor: colors.textPrimary, transform: [{ rotate: '18deg' }] }} />
        <View style={{ position: 'absolute', bottom: -7, right: 12, width: 3, height: 10, borderRadius: 2, backgroundColor: colors.textPrimary, transform: [{ rotate: '-18deg' }] }} />
      </Animated.View>
    </View>
  );
}
