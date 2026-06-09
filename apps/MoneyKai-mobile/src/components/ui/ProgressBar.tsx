import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Typography } from '../../constants/theme';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
  style?: ViewStyle;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  backgroundColor,
  height = 8,
  showLabel = false,
  label,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const barColor = color || colors.primary;
  const bgColor = backgroundColor || (isDark ? colors.border : colors.borderLight);
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={style}>
      {(showLabel || label) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          {label && (
            <Text style={{
              fontSize: Typography.fontSize.xs,
              fontFamily: Typography.fontFamily.medium,
              color: colors.textSecondary,
            }}>
              {label}
            </Text>
          )}
          {showLabel && (
            <Text style={{
              fontSize: Typography.fontSize.xs,
              fontFamily: Typography.fontFamily.semiBold,
              color: barColor,
            }}>
              {Math.round(clampedProgress)}%
            </Text>
          )}
        </View>
      )}
      <View
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: bgColor,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${clampedProgress}%`,
            borderRadius: height / 2,
            backgroundColor: barColor,
          }}
        />
      </View>
    </View>
  );
};

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 80,
  strokeWidth = 8,
  color,
  backgroundColor,
  children,
}) => {
  const { colors } = useTheme();
  const barColor = color || colors.primary;
  const bgColor = backgroundColor || colors.borderLight;
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: bgColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Progress overlay - simplified without SVG */}
        <View style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'transparent',
          borderTopColor: barColor,
          borderRightColor: clampedProgress > 25 ? barColor : 'transparent',
          borderBottomColor: clampedProgress > 50 ? barColor : 'transparent',
          borderLeftColor: clampedProgress > 75 ? barColor : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }} />
        {children}
      </View>
    </View>
  );
};

export default ProgressBar;
