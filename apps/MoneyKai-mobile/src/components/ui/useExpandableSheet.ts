import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, type LayoutChangeEvent } from 'react-native';
import { isVerticalSheetDrag, resolveSheetGesture, sheetDragFrame } from '@/utils/sheetGesture';

interface Options {
  enabled: boolean;
  visible: boolean;
  fullHeight: number;
  translateY: Animated.Value;
  reduceMotion: boolean;
  dismiss: () => void;
}

/** Only the grabber owns this responder, so the content ScrollView remains independent. */
export function useExpandableSheet({ enabled, visible, fullHeight, translateY, reduceMotion, dismiss }: Options) {
  const [sheetHeight] = useState(() => new Animated.Value(1));
  const [resized, setResized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const restHeight = useRef(1);
  const currentHeight = useRef(1);
  const startHeight = useRef(1);
  const startedExpanded = useRef(false);
  const dragging = useRef(false);
  const previousFullHeight = useRef(fullHeight);

  useEffect(() => {
    const listener = sheetHeight.addListener(({ value }) => { currentHeight.current = value; });
    return () => { sheetHeight.removeListener(listener); sheetHeight.stopAnimation(); };
  }, [sheetHeight]);

  useEffect(() => {
    setResized(false);
    setExpanded(false);
    dragging.current = false;
  }, [visible, enabled]);

  useEffect(() => {
    if (previousFullHeight.current === fullHeight) return;
    previousFullHeight.current = fullHeight;
    dragging.current = false;
    restHeight.current = Math.min(restHeight.current, fullHeight);
    if (resized) {
      translateY.stopAnimation();
      translateY.setValue(0);
      sheetHeight.setValue(expanded ? fullHeight : restHeight.current);
    }
  }, [fullHeight, resized, expanded, sheetHeight, translateY]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    if (!enabled || resized) return;
    restHeight.current = Math.min(event.nativeEvent.layout.height, fullHeight);
    sheetHeight.setValue(restHeight.current);
  }, [enabled, resized, fullHeight, sheetHeight]);

  const settle = useCallback((toExpanded: boolean) => {
    dragging.current = false;
    setExpanded(toExpanded);
    const target = toExpanded ? fullHeight : restHeight.current;
    if (reduceMotion) {
      sheetHeight.setValue(target);
      translateY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.spring(sheetHeight, { toValue: target, useNativeDriver: false, tension: 82, friction: 12, overshootClamping: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: false, tension: 82, friction: 12 }),
    ]).start();
  }, [fullHeight, reduceMotion, sheetHeight, translateY]);

  const expand = useCallback(() => {
    if (!enabled) return;
    setResized(true);
    settle(true);
  }, [enabled, settle]);

  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) => enabled && isVerticalSheetDrag(gesture.dx, gesture.dy, gesture.numberActiveTouches),
    onMoveShouldSetPanResponder: (_, gesture) => enabled && isVerticalSheetDrag(gesture.dx, gesture.dy, gesture.numberActiveTouches),
    onPanResponderGrant: () => {
      dragging.current = true;
      sheetHeight.stopAnimation();
      translateY.stopAnimation();
      translateY.setValue(0);
      startHeight.current = currentHeight.current;
      startedExpanded.current = expanded;
      setResized(true);
    },
    onPanResponderMove: (_, gesture) => {
      const frame = sheetDragFrame(startHeight.current, fullHeight, gesture.dy);
      sheetHeight.setValue(frame.height);
      translateY.setValue(frame.translateY);
    },
    onPanResponderRelease: (_, gesture) => {
      const result = resolveSheetGesture(gesture.dx, gesture.dy, gesture.vy, true, fullHeight - startHeight.current);
      if (result === 'dismiss') { dragging.current = false; dismiss(); }
      else settle(result === 'expand' || startedExpanded.current);
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderTerminate: () => settle(startedExpanded.current),
  }), [enabled, expanded, fullHeight, sheetHeight, translateY, dismiss, settle]);

  const expansion = sheetHeight.interpolate({
    inputRange: [restHeight.current, Math.max(restHeight.current + 1, fullHeight)],
    outputRange: [0, 1], extrapolate: 'clamp',
  });
  return { panHandlers: responder.panHandlers, sheetHeight, resized, expanded, expansion, onLayout, expand };
}
