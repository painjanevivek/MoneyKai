import { Platform, type ViewStyle } from 'react-native';

const makeBackdropStyle = (blur: number, saturation: number): ViewStyle | null =>
  Platform.OS === 'web'
    ? ({
        backdropFilter: `blur(${blur}px) saturate(${saturation})`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation})`,
      } as ViewStyle)
    : null;

export const softGlassBackdropStyle = makeBackdropStyle(18, 1.16);
export const glassBackdropStyle = makeBackdropStyle(22, 1.18);
export const strongGlassBackdropStyle = makeBackdropStyle(28, 1.22);

export const withAlpha = (color: string, alpha: number): string => {
  const clampedAlpha = Math.min(1, Math.max(0, alpha));
  const hexMatch = color.trim().match(/^#([0-9a-f]{6})$/i);

  if (!hexMatch) {
    return color;
  }

  const hex = hexMatch[1];
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${clampedAlpha})`;
};
