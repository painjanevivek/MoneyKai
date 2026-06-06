import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { getNextResetDate, formatDate } from '../../utils/dateUtils';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';

export const MonthlyReset: React.FC = () => {
  const { colors } = useTheme();
  const { settings, updateSettings, addAdjustment } = useBudgetStore();
  const nextReset = getNextResetDate(settings.reset_day);

  const [amount, setAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');

  const handleUpdateAllowance = () => {
    const parsed = parseFloat(amount);
    if (!amount || Number.isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a positive number.');
      return;
    }

    addAdjustment({
      amount: parsed,
      type: adjustType,
      reason: 'Manual adjustment from dashboard',
      date: new Date().toISOString(),
    });
    setAmount('');
    Alert.alert(
      'Allowance Updated',
      `₹${parsed.toLocaleString('en-IN')} ${adjustType === 'add' ? 'added to' : 'subtracted from'} your monthly allowance.`
    );
  };

  const handleResetDayPicker = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Reset Day',
        'Enter the day of the month (1-28) when your budget resets:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: (value: string | undefined) => {
              const day = parseInt(value ?? '', 10);
              if (Number.isNaN(day) || day < 1 || day > 28) {
                Alert.alert('Invalid day', 'Please enter a number between 1 and 28.');
              } else {
                updateSettings({ reset_day: day });
              }
            },
          },
        ],
        'plain-text',
        String(settings.reset_day)
      );
      return;
    }

    const options = [1, 5, 10, 15, 20, 25, 28].map((d) => ({
      text: `Day ${d}`,
      onPress: () => updateSettings({ reset_day: d }),
    }));

    Alert.alert('Reset Day', 'Choose the day your budget resets each month:', [...options, { text: 'Cancel', style: 'cancel' as const }]);
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
          backgroundColor: colors.primaryBg,
          borderRadius: BorderRadius.sm,
          padding: Spacing.md,
          marginBottom: Spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
                backgroundColor: colors.primary,
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
        <TouchableOpacity
          onPress={handleResetDayPicker}
          style={{
            width: 40,
            height: 40,
            borderRadius: BorderRadius.sm,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: Spacing.sm }}>
        Manual Adjustment
      </Text>
      <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: colors.textSecondary, marginBottom: Spacing.sm }}>
        Adjust allowance for this month
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
            <TouchableOpacity
              key={type}
              onPress={() => setAdjustType(type)}
                style={{
                  paddingHorizontal: Spacing.sm,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: adjustType === type ? colors.primary : colors.surface,
                }}
            >
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: adjustType === type ? colors.textInverse : colors.textSecondary }}>
                {type === 'add' ? '+ Add' : '- Sub'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={handleUpdateAllowance}
        style={{
          backgroundColor: colors.primary,
          borderRadius: BorderRadius.sm,
          paddingVertical: Spacing.sm,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
          Update Allowance
        </Text>
      </TouchableOpacity>
    </Card>
  );
};

export default MonthlyReset;
