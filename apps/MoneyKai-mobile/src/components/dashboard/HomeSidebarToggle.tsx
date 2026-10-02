import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { PressableScale } from '@/components/ui/PressableScale';
import { BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  expanded: boolean;
  onPress: () => void;
};

export function HomeSidebarToggle({ expanded, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <PressableScale
      accessibilityLabel={expanded ? 'Close Home sidebar' : 'Open Home sidebar'}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={{ alignItems: 'center', height: 48, justifyContent: 'center', width: 48 }}
    >
      <View style={{ alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: BorderRadius.full, height: 32, justifyContent: 'center', width: 32 }}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Rect x={2.5} y={4} width={19} height={16} rx={4} stroke={colors.textPrimary} strokeWidth={1.6} />
          <Path d={expanded ? 'M10.5 4.5v15' : 'M7 4.5v15'} stroke={colors.textPrimary} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      </View>
    </PressableScale>
  );
}
