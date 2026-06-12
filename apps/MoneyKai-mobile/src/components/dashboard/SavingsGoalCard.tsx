import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { BorderRadius, Spacing, Typography } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';

type SavingsGoalCardProps = {
  title: string;
  subtitle: string;
  current: number;
  target: number;
  progress: number;
  icon: string;
  color: string;
  onPress?: () => void;
};

export const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({
  title,
  subtitle,
  current,
  target,
  progress,
  icon,
  color,
  onPress,
}) => {
  const { colors } = useTheme();

  const content = (
    <Card style={{ gap: Spacing.md, borderRadius: BorderRadius['2xl'] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>
            Savings Goal
          </Text>
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginTop: 2 }}>
            {title}
          </Text>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
            {subtitle}
          </Text>
        </View>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${color}15`,
            borderWidth: 1,
            borderColor: `${color}22`,
          }}
        >
          <MaterialCommunityIcons name={icon as any} size={20} color={color} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <View style={{ flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Current Saved</Text>
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
            {formatCurrency(current)}
          </Text>
        </View>
        <View style={{ flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Target</Text>
          <Text style={{ fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
            {formatCurrency(target)}
          </Text>
        </View>
      </View>

      <ProgressBar progress={progress} color={color} height={8} showLabel label="Goal progress" />
    </Card>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
};

export default SavingsGoalCard;
