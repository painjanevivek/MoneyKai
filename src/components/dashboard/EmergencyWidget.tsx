import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export const EmergencyWidget: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  const { colors } = useTheme();
  const { isEmergencyMode, toggleEmergencyMode } = useBudgetStore();

  return (
    <TouchableOpacity
      onPress={onPress || toggleEmergencyMode}
      activeOpacity={0.8}
      style={{
        backgroundColor: isEmergencyMode ? colors.emergencyBg : colors.card,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        borderWidth: isEmergencyMode ? 2 : 1,
        borderColor: isEmergencyMode ? colors.emergency : colors.border,
        ...Shadows.md,
        shadowColor: isEmergencyMode ? colors.emergency : colors.shadowColor,
        marginBottom: Spacing.xs,
      }}
    >
      <Text style={{
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.semiBold,
        color: colors.textPrimary,
        marginBottom: Spacing.md,
      }}>Emergency Mode</Text>
      <View style={{ alignItems: 'center', marginBottom: Spacing.md }}>
        <View style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: isEmergencyMode ? colors.emergency : `${colors.emergency}15`,
          alignItems: 'center',
          justifyContent: 'center',
          ...(isEmergencyMode ? Shadows.glow(colors.emergency) : {}),
        }}>
          <Text style={{
            fontSize: Typography.fontSize.xl,
            fontFamily: Typography.fontFamily.bold,
            color: isEmergencyMode ? colors.textInverse : colors.emergency,
          }}>SOS</Text>
        </View>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{
          fontSize: Typography.fontSize.sm,
          fontFamily: Typography.fontFamily.semiBold,
          color: isEmergencyMode ? colors.emergency : colors.textPrimary,
        }}>{isEmergencyMode ? 'Emergency Active' : 'Low Balance?'}</Text>
        <Text style={{
          fontSize: Typography.fontSize.xs,
          fontFamily: Typography.fontFamily.regular,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: 2,
        }}>
          {isEmergencyMode
            ? 'Tap to deactivate emergency mode'
            : 'Need help managing your budget?\nTap SOS for quick actions'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Floating SOS Button
export const SOSFloatingButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isEmergencyMode } = useBudgetStore();

  if (!isEmergencyMode) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        position: 'absolute',
        bottom: insets.bottom + 24,
        right: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.emergency,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.glow(colors.emergency),
        zIndex: 999,
      }}
    >
      <Text style={{
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.bold,
        color: colors.textInverse,
      }}>SOS</Text>
    </TouchableOpacity>
  );
};

export default EmergencyWidget;
