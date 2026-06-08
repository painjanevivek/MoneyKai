import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { calculateBudgetHealth, getBudgetHealthColor } from '../../utils/savingsEngine';
import { Typography, Spacing } from '../../constants/theme';

export const BudgetHealth: React.FC<{ totalSpent?: number }> = ({ totalSpent: totalSpentProp }) => {
  const { colors } = useTheme();
  const storeTotalSpent = useTransactionStore((s) => s.getTotalSpent());
  const { settings } = useBudgetStore();
  const totalSpent = totalSpentProp ?? storeTotalSpent;
  const health = calculateBudgetHealth(settings.monthly_allowance, totalSpent);
  const healthColor = getBudgetHealthColor(health.level, colors);
  const trackColor = colors.border;

  return (
    <Card>
      <Text style={{
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.semiBold,
        color: colors.textPrimary,
        marginBottom: Spacing.md,
      }}>Budget Health</Text>

      {/* Gauge */}
      <View style={{ alignItems: 'center', marginBottom: Spacing.md }}>
        <View style={{
          width: 140,
          height: 75,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Background arc */}
          <View style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            borderWidth: 12,
            borderColor: trackColor,
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            transform: [{ rotate: '0deg' }],
          }} />
          {/* Progress arc */}
          <View style={{
            position: 'absolute',
            width: 140,
            height: 140,
            borderRadius: 70,
            borderWidth: 12,
            borderColor: 'transparent',
            borderTopColor: healthColor,
            borderRightColor: health.score > 50 ? healthColor : 'transparent',
            transform: [{ rotate: '-90deg' }],
          }} />
          {/* Score labels */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
            <Text style={{ fontSize: 10, color: colors.textTertiary, fontFamily: Typography.fontFamily.medium }}>0</Text>
            <Text style={{ fontSize: 10, color: colors.textTertiary, fontFamily: Typography.fontFamily.medium }}>100</Text>
          </View>
        </View>

        {/* Score */}
        <View style={{
          marginTop: -10,
          alignItems: 'center',
        }}>
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: `${healthColor}24`,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: `${healthColor}40`,
          }}>
            <MaterialCommunityIcons
              name={health.score >= 60 ? 'heart' : health.score >= 30 ? 'heart-half-full' : 'heart-broken'}
              size={24}
              color={healthColor}
            />
          </View>
        </View>
      </View>

      {/* Label */}
      <View style={{ alignItems: 'center' }}>
        <Text style={{
          fontSize: Typography.fontSize.xl,
          fontFamily: Typography.fontFamily.bold,
          color: healthColor,
          marginBottom: 4,
        }}>{health.label}</Text>
        <Text style={{
          fontSize: Typography.fontSize.xs,
          fontFamily: Typography.fontFamily.regular,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 18,
        }}>{health.message}</Text>
      </View>
    </Card>
  );
};

export default BudgetHealth;
