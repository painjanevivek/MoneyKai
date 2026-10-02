import React from 'react';
import { Text as NativeText, type TextProps } from 'react-native';
import { Typography } from '@/constants/theme';

export const AppText = React.forwardRef<React.ComponentRef<typeof NativeText>, TextProps>(
  function AppText({ style, ...props }, ref) {
    return <NativeText ref={ref} {...props} style={[{ fontFamily: Typography.fontFamily.regular }, style]} />;
  },
);
