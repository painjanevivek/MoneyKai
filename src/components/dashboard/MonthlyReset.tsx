import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { getNextResetDate, formatDate } from '../../utils/dateUtils';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';

export const MonthlyReset: React.FC = () => {
  const { colors } = useTheme();
  const { settings } = useBudgetStore();
  const nextReset = getNextResetDate(settings.reset_day);

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text style={{
          fontSize: Typography.fontSize.md,
          fontFamily: Typography.fontFamily.semiBold,
          color: colors.textPrimary,
        }}>Smart Monthly Reset</Text>
        <MaterialCommunityIcons name="information-outline" size={18} color={colors.textTertiary} />
      </View>

      {/* Auto Reset Status */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryBg,
        borderRadius: BorderRadius.sm,
        padding: Spacing.md,
        marginBottom: Spacing.md,
      }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
            }}>
              <Text style={{
                fontSize: Typography.fontSize.xs,
                fontFamily: Typography.fontFamily.semiBold,
                color: '#FFFFFF',
              }}>Auto Reset On</Text>
            </View>
          </View>
          <Text style={{
            fontSize: Typography.fontSize.xs,
            fontFamily: Typography.fontFamily.regular,
            color: colors.textSecondary,
            marginTop: 4,
          }}>Next reset on {formatDate(nextReset, 'd MMMM yyyy')}</Text>
        </View>
        <TouchableOpacity style={{
          width: 40,
          height: 40,
          borderRadius: BorderRadius.sm,
          backgroundColor: colors.card,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Manual Adjustment Section */}
      <Text style={{
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.semiBold,
        color: colors.textPrimary,
        marginBottom: Spacing.sm,
      }}>Manual Adjustment</Text>
      <Text style={{
        fontSize: Typography.fontSize.xs,
        fontFamily: Typography.fontFamily.regular,
        color: colors.textSecondary,
        marginBottom: Spacing.sm,
      }}>Adjust allowance for this month</Text>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <View style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: BorderRadius.sm,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: Spacing.md,
          height: 40,
        }}>
          <Text style={{
            fontSize: Typography.fontSize.base,
            fontFamily: Typography.fontFamily.semiBold,
            color: colors.textPrimary,
          }}>₹ </Text>
          <Text style={{
            fontSize: Typography.fontSize.base,
            fontFamily: Typography.fontFamily.regular,
            color: colors.textTertiary,
          }}>0</Text>
        </View>
        <View style={{
          backgroundColor: colors.surface,
          borderRadius: BorderRadius.sm,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: Spacing.md,
          height: 40,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}>
          <Text style={{
            fontSize: Typography.fontSize.sm,
            fontFamily: Typography.fontFamily.medium,
            color: colors.textSecondary,
          }}>Add / Subtract</Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textTertiary} />
        </View>
      </View>

      <TouchableOpacity style={{
        backgroundColor: colors.primary,
        borderRadius: BorderRadius.sm,
        paddingVertical: Spacing.sm,
        alignItems: 'center',
      }}>
        <Text style={{
          fontSize: Typography.fontSize.sm,
          fontFamily: Typography.fontFamily.semiBold,
          color: '#FFFFFF',
        }}>Update Allowance</Text>
      </TouchableOpacity>
    </Card>
  );
};

export default MonthlyReset;
