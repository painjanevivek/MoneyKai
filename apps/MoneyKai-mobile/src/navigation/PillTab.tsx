import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText as Text } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';
import { Colors, NotificationBadgeColor, Typography } from '@/constants/theme';
import { getPillContentGeometry } from './pillGeometry';

interface PillTabProps {
  label: string;
  icon: string;
  selectedIcon: string;
  selected: boolean;
  badge?: string | number;
  inactiveWidth: number;
  activeWidth: number;
  minHeight: number;
  largeText: boolean;
  reduceMotion: boolean;
  duration: number;
  slotX: number;
  barPadding: number;
  onPress: () => void;
  onLongPress: () => void;
}

/** Retargets from the current value, so fast tab taps never queue animations. */
export function PillTab({ label, icon, selectedIcon, selected, badge, inactiveWidth, activeWidth, minHeight, largeText, reduceMotion, duration, slotX, barPadding, onPress, onLongPress }: PillTabProps) {
  const [labelWidth, setLabelWidth] = useState(label.length * 13 * 0.6);
  const { iconLeft, labelLeft, labelSpace } = getPillContentGeometry(activeWidth, labelWidth);
  const progress = useSharedValue(selected ? 1 : 0);
  const position = useSharedValue(slotX);
  useEffect(() => {
    progress.value = reduceMotion ? Number(selected) : withTiming(Number(selected), { duration, easing: Easing.out(Easing.cubic) });
    position.value = reduceMotion ? slotX : withTiming(slotX, { duration, easing: Easing.out(Easing.cubic) });
    return () => { cancelAnimation(progress); cancelAnimation(position); };
  }, [duration, position, progress, reduceMotion, selected, slotX]);
  const tabStyle = useAnimatedStyle(() => largeText ? ({
    width: inactiveWidth,
    backgroundColor: largeText ? interpolateColor(progress.value, [0, 1], [Colors.light.primary, Colors.light.primaryLight]) : 'transparent',
  }) : ({ width: activeWidth, transform: [{ translateX: position.value }] }));
  const iconStyle = useAnimatedStyle(() => largeText ? {} : ({
    transform: [{ translateX: (inactiveWidth - 25) / 2 + (iconLeft - (inactiveWidth - 25) / 2) * progress.value }],
  }));
  const labelStyle = useAnimatedStyle(() => largeText ? {} : ({
    opacity: progress.value,
    transform: [{ translateX: 6 * (1 - progress.value) }],
  }));
  return (
    <Animated.View pointerEvents="box-none" style={[styles.shell, !largeText && { position: 'absolute', left: barPadding, top: barPadding }, tabStyle]}>
      <PressableScale
        accessibilityRole="tab"
        accessibilityLabel={badge ? `${label}, ${badge} unread` : label}
        accessibilityState={{ selected }}
        onPress={onPress}
        onLongPress={onLongPress}
        style={[styles.tab, { minHeight, width: selected ? activeWidth : inactiveWidth }, largeText && styles.largeTextTab]}
      >
        <Animated.View pointerEvents="none" style={[styles.iconWrap, !largeText && styles.absoluteIcon, iconStyle]}>
          <AppIcon name={selected ? selectedIcon : icon} size={24} variant={selected ? 'solid' : 'outline'} color={Colors.light.textInverse} />
          {badge ? <View style={styles.badge} /> : null}
        </Animated.View>
        <Animated.View pointerEvents="none" testID={`tab-label-${label}`} accessibilityElementsHidden={!selected && !largeText} importantForAccessibility="no-hide-descendants" style={[styles.labelMask, !largeText && { position: 'absolute', left: labelLeft, width: labelSpace }, labelStyle]}>
          <Text accessible={false} numberOfLines={1} maxFontSizeMultiplier={2} onTextLayout={event => {
            if (largeText) return;
            const width = event.nativeEvent.lines[0]?.width;
            if (typeof width === 'number' && Number.isFinite(width) && width > 0) setLabelWidth(previous => Math.abs(previous - width) > 0.5 ? width : previous);
          }} style={[styles.label, !largeText && styles.horizontalLabel, !selected && styles.inactiveLabel]}>{label}</Text>
        </Animated.View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: { borderRadius: 40, minWidth: 0 },
  tab: { borderRadius: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  largeTextTab: { flexDirection: 'column', gap: 2 },
  iconWrap: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center' },
  absoluteIcon: { position: 'absolute', left: 0 },
  labelMask: { overflow: 'hidden' },
  label: { color: Colors.light.textInverse, fontFamily: Typography.fontFamily.medium, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  horizontalLabel: { textAlign: 'left' },
  inactiveLabel: { color: 'rgba(255, 255, 255, 0.72)' },
  badge: { position: 'absolute', top: -3, right: -4, height: 8, width: 8, borderRadius: 4, backgroundColor: NotificationBadgeColor },
});
