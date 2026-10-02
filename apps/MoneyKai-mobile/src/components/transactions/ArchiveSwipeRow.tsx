import React, { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText as Text } from '@/components/ui/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useAppMotion } from '@/hooks/useAppMotion';
import { Spacing } from '@/constants/theme';
import { hapticForSelection } from '@/services/hapticsService';

export const isArchiveSwipe = (dx: number, dy: number, touches = 1) => touches === 1 && dx < -12 && Math.abs(dx) > Math.abs(dy) * 1.5;
export function ArchiveSwipeRow({ children, onArchive, restore = false }: { children: ReactNode; onArchive: () => boolean; restore?: boolean }) {
  const { colors } = useTheme();
  const { reduceMotion } = useAppMotion();
  const translate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const height = useRef(new Animated.Value(0)).current;
  const measured = useRef(0);
  const [measuredSize, setMeasuredSize] = useState(false);
  const archiving = useRef(false);
  const mounted = useRef(true);
  const callback = useRef(onArchive);
  callback.current = onArchive;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; translate.stopAnimation(); opacity.stopAnimation(); height.stopAnimation(); }; }, [height, opacity, translate]);
  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) => !archiving.current && isArchiveSwipe(gesture.dx, gesture.dy, gesture.numberActiveTouches),
    onPanResponderMove: (_, gesture) => translate.setValue(Math.max(-180, Math.min(0, gesture.dx))),
    onPanResponderTerminationRequest: () => !archiving.current,
    onPanResponderTerminate: () => Animated.timing(translate, { toValue: 0, duration: reduceMotion ? 0 : 160, useNativeDriver: false }).start(),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > -80 || Math.abs(gesture.dy) >= Math.abs(gesture.dx)) {
        Animated.timing(translate, { toValue: 0, duration: reduceMotion ? 0 : 160, useNativeDriver: false }).start(); return;
      }
      archiving.current = true;
      hapticForSelection();
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: reduceMotion ? 0 : 160, useNativeDriver: false }),
        Animated.timing(translate, { toValue: -180, duration: reduceMotion ? 0 : 160, useNativeDriver: false }),
        Animated.timing(height, { toValue: 0, duration: reduceMotion ? 0 : 220, useNativeDriver: false }),
      ]).start(({ finished }) => {
        if (finished && mounted.current && !callback.current()) {
          archiving.current = false; height.setValue(measured.current); opacity.setValue(1); translate.setValue(0);
        }
      });
    },
  }), [height, opacity, reduceMotion, translate]);
  return <Animated.View style={{ overflow: 'hidden', height: measuredSize ? height : undefined }}>
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, bottom: 0, right: 0, left: 0, backgroundColor: colors.surfaceElevated, alignItems: 'flex-end', justifyContent: 'center', paddingRight: Spacing.lg }}><AppIcon name={restore ? 'archive-arrow-up-outline' : 'archive-outline'} size={24} color={colors.textPrimary} /><Text style={{ color: colors.textPrimary }}>{restore ? 'Restore' : 'Archive'}</Text></View>
    <Animated.View {...responder.panHandlers} onLayout={event => { if (!archiving.current && measured.current !== event.nativeEvent.layout.height) { measured.current = event.nativeEvent.layout.height; height.setValue(measured.current); setMeasuredSize(true); } }} style={{ opacity, transform: [{ translateX: translate }], backgroundColor: colors.card }}>{children}</Animated.View>
  </Animated.View>;
}
