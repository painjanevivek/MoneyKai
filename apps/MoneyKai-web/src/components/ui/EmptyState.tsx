import React from 'react';
import { type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SurfaceState from './SurfaceState';

interface EmptyStateProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox-outline',
  title,
  message,
  action,
  style,
}) => {
  return (
    <SurfaceState
      detail={message}
      headline={title}
      icon={icon}
      kind="empty"
      primaryAction={action}
      style={style}
    />
  );
};

export default EmptyState;
