import React, { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { AppIcon } from './AppIcon';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAppMotion } from '@/hooks/useAppMotion';

export function Disclosure({ title, summary, children, defaultOpen = false }: {
  title: string;
  summary?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const { colors } = useTheme();
  const { duration } = useAppMotion();
  const [expanded, setExpanded] = useState(defaultOpen);
  const [visited, setVisited] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState(0);
  const contentStyle = useAnimatedStyle(() => ({
    height: withTiming(expanded ? contentHeight : 0, { duration, easing: Easing.out(Easing.cubic) }),
    opacity: withTiming(expanded ? 1 : 0, { duration: duration ? 150 : 0 }),
  }), [expanded, contentHeight, duration]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(expanded ? '180deg' : '0deg', { duration }) }],
  }), [expanded, duration]);
  return (
    <View style={[styles.container, { borderTopColor: colors.borderLight }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={summary}
        accessibilityState={{ expanded }}
        onPress={() => { setVisited(true); setExpanded((value) => !value); }}
        style={({ pressed }) => [styles.trigger, { opacity: pressed ? 0.7 : 1 }]}
      >
        <View style={styles.label}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          {summary ? <Text style={[styles.summary, { color: colors.textSecondary }]}>{summary}</Text> : null}
        </View>
        <Animated.View style={chevronStyle}><AppIcon name="chevron-down" color={colors.textSecondary} size={20} /></Animated.View>
      </Pressable>
      <Animated.View
        style={[styles.clip, contentStyle]}
        pointerEvents={expanded ? 'auto' : 'none'}
        accessibilityElementsHidden={!expanded}
        importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
      >
        {visited ? <View style={styles.content} onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}>{children}</View> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: Spacing.md },
  trigger: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md, minHeight: 48, paddingVertical: Spacing.md },
  label: { flex: 1 },
  title: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md },
  summary: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, lineHeight: Typography.lineHeight.md, marginTop: 4 },
  clip: { overflow: 'hidden' },
  content: { position: 'absolute', top: 0, left: 0, right: 0, paddingBottom: Spacing.sm },
});
