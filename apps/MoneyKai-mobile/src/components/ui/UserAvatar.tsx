import React from 'react';
import { View, Text, Image, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Typography } from '@/constants/theme';

interface UserAvatarProps {
  name?: string;
  email?: string;
  avatarUrl?: string;
  size?: number;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  email,
  avatarUrl,
  size = 40,
  containerStyle,
  imageStyle,
}) => {
  const { colors } = useTheme();
  const initials = (name || email || 'U').trim()[0]?.toUpperCase() ?? 'U';
  const baseImageStyle: ImageStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[baseImageStyle, imageStyle]}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        containerStyle,
      ]}
    >
      <Text
        style={{
          fontSize: Math.max(14, Math.round(size * 0.38)),
          fontFamily: Typography.fontFamily.bold,
          color: colors.textInverse,
        }}
      >
        {initials}
      </Text>
    </View>
  );
};

export default UserAvatar;
