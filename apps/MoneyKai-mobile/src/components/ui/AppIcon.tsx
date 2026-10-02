import React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { HEROICON_ALIASES } from './heroiconAliases';
import { HEROICON_PATHS, HEROICON_SOLID_PATHS } from './heroiconPaths';

type AppIconProps = {
  accessibilityLabel?: string;
  color: string;
  name: string;
  size: number;
  style?: StyleProp<TextStyle>;
  variant?: 'outline' | 'solid';
};

export function resolveHeroicon(name: string) { return HEROICON_ALIASES[name] ?? name; }

/** Native SVGs bundled offline: no remote images or font glyph fallbacks. */
export function AppIcon({ accessibilityLabel, color, name, size, style, variant = 'outline' }: AppIconProps) {
  const icon = resolveHeroicon(name);
  const paths = (variant === 'solid' ? HEROICON_SOLID_PATHS : HEROICON_PATHS)[icon] ?? HEROICON_PATHS['question-mark-circle'];
  return <Svg
    width={size} height={size} viewBox="0 0 24 24"
    fill={variant === 'solid' ? color : 'none'}
    stroke={variant === 'solid' ? undefined : color} strokeWidth={variant === 'solid' ? undefined : 1.5}
    accessibilityLabel={accessibilityLabel} accessible={Boolean(accessibilityLabel)}
    importantForAccessibility={accessibilityLabel ? 'yes' : 'no'}
    style={style as StyleProp<ViewStyle>}
  >{paths.map((path, index) => <Path key={index} d={path.d} fillRule={path.fillRule} clipRule={path.fillRule} strokeLinecap="round" strokeLinejoin="round" />)}</Svg>;
}

export default AppIcon;
