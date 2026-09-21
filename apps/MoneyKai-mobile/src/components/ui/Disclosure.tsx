import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, findNodeHandle, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { AppIcon } from './AppIcon';
import { ComponentTokens, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAppMotion } from '@/hooks/useAppMotion';

type DisclosureProps = {
  title: string;
  summary?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
};

export function Disclosure({ title, summary, children, defaultOpen = false, disabled = false }: DisclosureProps) {
  const { colors } = useTheme();
  const { duration } = useAppMotion();
  const [expanded, setExpanded] = useState(defaultOpen);
  const [visited, setVisited] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState(0);
  const triggerRef = useRef<View>(null);
  const hasToggled = useRef(false);

  useEffect(() => {
    if (!hasToggled.current) return undefined;

    const frame = requestAnimationFrame(() => {
      const triggerHandle = findNodeHandle(triggerRef.current);
      if (triggerHandle) AccessibilityInfo.setAccessibilityFocus(triggerHandle);
    });

    return () => cancelAnimationFrame(frame);
  }, [expanded]);

  const contentStyle = useAnimatedStyle(
    () => ({
      height: withTiming(expanded ? contentHeight : 0, { duration, easing: Easing.out(Easing.cubic) }),
      opacity: withTiming(expanded ? 1 : 0, { duration }),
    }),
    [contentHeight, duration, expanded]
  );
  const chevronStyle = useAnimatedStyle(
    () => ({ transform: [{ rotate: withTiming(expanded ? '180deg' : '0deg', { duration }) }] }),
    [duration, expanded]
  );

  return (
    <View style={[styles.container, { borderTopColor: colors.borderLight }]}>
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={summary}
        accessibilityState={{ disabled, expanded }}
        disabled={disabled}
        onPress={() => {
          hasToggled.current = true;
          setVisited(true);
          setExpanded((value) => !value);
        }}
        style={({ pressed }) => [styles.trigger, { opacity: pressed ? ComponentTokens.pressedOpacity : 1 }]}
      >
        <View style={styles.label}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          {summary ? <Text style={[styles.summary, { color: colors.textSecondary }]}>{summary}</Text> : null}
        </View>
        <Animated.View style={chevronStyle}>
          <AppIcon name="chevron-down" color={colors.textSecondary} size={20} />
        </Animated.View>
      </Pressable>
      <Animated.View
        accessibilityElementsHidden={!expanded}
        importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
        pointerEvents={expanded ? 'auto' : 'none'}
        style={[styles.clip, contentStyle]}
      >
        {visited ? (
          <View style={styles.content} onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}>
            {children}
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: StyleSheet.hairlineWidth },
  trigger: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    minHeight: ComponentTokens.controlHeight.md,
    paddingVertical: Spacing.md,
  },
  label: { flex: 1 },
  title: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.base },
  summary: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    lineHeight: Typography.lineHeight.sm,
    marginTop: Spacing.xs,
  },
  clip: { overflow: 'hidden' },
  content: { left: 0, paddingBottom: Spacing.md, position: 'absolute', right: 0, top: 0 },
});
