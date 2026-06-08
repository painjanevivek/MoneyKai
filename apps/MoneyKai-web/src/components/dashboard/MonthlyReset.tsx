import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ExpoDateTimePicker from '@expo/ui/community/datetime-picker';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { getNextResetDate, formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '@/utils/formatCurrency';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';

export const MonthlyReset: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { settings, updateSettings, addAdjustment } = useBudgetStore();
  const nextReset = getNextResetDate(settings.reset_day);
  const resetDateInputValue = formatDate(nextReset, 'yyyy-MM-dd');

  const [amount, setAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [showResetPicker, setShowResetPicker] = useState(false);

  const handleUpdateAllowance = () => {
    const parsed = parseFloat(amount);
    if (!amount || Number.isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a positive number.');
      return;
    }

    addAdjustment({
      amount: parsed,
      type: adjustType,
      reason: 'Manual adjustment from settings',
      date: new Date().toISOString(),
    });
    setAmount('');
    Alert.alert(
      'Budget Updated',
      `${formatCurrency(parsed)} ${adjustType === 'add' ? 'added to' : 'subtracted from'} your monthly budget.`
    );
  };

  const handleResetDateChange = (date: Date) => {
    if (!Number.isFinite(date.getTime())) {
      Alert.alert('Invalid date', 'Choose a valid reset date.');
      return;
    }

    updateSettings({ reset_day: date.getDate() });
    setShowResetPicker(false);
  };

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
          Smart Monthly Reset
        </Text>
        <MaterialCommunityIcons name="information-outline" size={18} color={colors.textTertiary} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? colors.surface : colors.primaryBg,
          borderRadius: BorderRadius.sm,
          padding: Spacing.md,
          marginBottom: Spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View
              style={{
                backgroundColor: isDark ? colors.textPrimary : colors.primary,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                Auto Reset {settings.auto_reset ? 'On' : 'Off'}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary, marginTop: 4 }}>
            Next reset on {formatDate(nextReset, 'd MMMM yyyy')}
          </Text>
        </View>
        <Pressable
          onPress={() => setShowResetPicker((current) => !current)}
          style={({ hovered, pressed }: any) => ({
            width: 40,
            height: 40,
            borderRadius: BorderRadius.sm,
            backgroundColor: hovered ? colors.surfaceElevated : colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: hovered ? `${colors.primary}45` : colors.border,
            transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
          })}
        >
          <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {showResetPicker ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: BorderRadius.sm,
            borderWidth: 1,
            borderColor: colors.border,
            padding: Spacing.md,
            marginBottom: Spacing.md,
            gap: Spacing.sm,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
            Choose the date your allowance arrives. MoneyKai will repeat this reset day every month.
          </Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={resetDateInputValue}
              min={formatDate(new Date(), 'yyyy-MM-dd')}
              onChange={(event) => handleResetDateChange(new Date(`${event.currentTarget.value}T12:00:00`))}
              style={{
                width: '100%',
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                background: colors.card,
                color: colors.textPrimary,
                fontSize: Typography.fontSize.sm,
                fontFamily: Typography.fontFamily.regular,
                padding: '10px 12px',
                outline: 'none',
              }}
            />
          ) : (
            <ExpoDateTimePicker
              value={nextReset}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={new Date()}
              onDismiss={() => setShowResetPicker(false)}
              onValueChange={(_, date) => handleResetDateChange(date)}
            />
          )}
        </View>
      ) : null}

      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
        Manual Adjustment
      </Text>
      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary, marginBottom: Spacing.sm }}>
        Adjust budget for this month
      </Text>

      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: BorderRadius.sm,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: Spacing.md,
            height: 40,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            ₹
          </Text>
          <TextInput
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            style={{
              flex: 1,
              fontSize: Typography.fontSize.base,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textPrimary,
              marginLeft: 4,
            }}
          />
        </View>

        <View style={{ flexDirection: 'row', borderRadius: BorderRadius.sm, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
          {(['add', 'subtract'] as const).map((type) => (
            <Pressable
              key={type}
              onPress={() => setAdjustType(type)}
              style={({ hovered }: any) => ({
                paddingHorizontal: Spacing.sm,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: adjustType === type ? (isDark ? colors.textPrimary : colors.primary) : hovered ? `${colors.primary}10` : colors.surface,
              })}
            >
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: adjustType === type ? (isDark ? colors.textInverse : colors.textInverse) : colors.textSecondary }}>
                {type === 'add' ? '+ Add' : '- Sub'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        onPress={handleUpdateAllowance}
        style={({ hovered, pressed }: any) => ({
          backgroundColor: hovered ? colors.primaryLight : colors.primary,
          borderRadius: BorderRadius.sm,
          paddingVertical: Spacing.sm,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: hovered ? colors.primaryLight : colors.primary,
          transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
        })}
      >
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
          Update Budget
        </Text>
      </Pressable>
    </Card>
  );
};

export default MonthlyReset;
