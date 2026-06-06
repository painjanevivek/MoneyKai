import React from 'react';
import { Platform, View, Text, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { Typography, Spacing } from '../../constants/theme';

// Sample weekly spending data
const THIS_MONTH_DATA = [
  { value: 800, label: '1 May' },
  { value: 1200, label: '8 May' },
  { value: 950, label: '15 May' },
  { value: 1400, label: '22 May' },
  { value: 1100, label: '29 May' },
];

const LAST_MONTH_DATA = [
  { value: 900, label: '1 Apr' },
  { value: 1100, label: '8 Apr' },
  { value: 1300, label: '15 Apr' },
  { value: 1200, label: '22 Apr' },
  { value: 1050, label: '29 Apr' },
];

export const TrendLineChart: React.FC = () => {
  const { colors } = useTheme();
  const isWeb = Platform.OS === 'web';
  const thisMonthData = isWeb
    ? THIS_MONTH_DATA.map((item) => ({
        ...item,
        customDataPoint: () => (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.primary,
              borderWidth: 2,
              borderColor: colors.background,
            }}
          />
        ),
      }))
    : THIS_MONTH_DATA;
  const lastMonthData = isWeb
    ? LAST_MONTH_DATA.map((item) => ({
        ...item,
        customDataPoint: () => (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.textTertiary,
              borderWidth: 2,
              borderColor: colors.background,
            }}
          />
        ),
      }))
    : LAST_MONTH_DATA;

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text style={{
          fontSize: Typography.fontSize.md,
          fontFamily: Typography.fontFamily.semiBold,
          color: colors.textPrimary,
        }}>Spending Trend</Text>
        <TouchableOpacity style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 6,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <Text style={{
            fontSize: Typography.fontSize.xs,
            fontFamily: Typography.fontFamily.medium,
            color: colors.textSecondary,
          }}>This Month</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: Spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 16, height: 2, backgroundColor: colors.primary, borderRadius: 1 }} />
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, fontFamily: Typography.fontFamily.medium }}>This Month</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 16, height: 2, backgroundColor: colors.textTertiary, borderRadius: 1, opacity: 0.5 }} />
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, fontFamily: Typography.fontFamily.medium }}>Last Month</Text>
        </View>
      </View>

      <LineChart
        data={thisMonthData}
        data2={lastMonthData}
        height={150}
        width={280}
        spacing={65}
        initialSpacing={10}
        color1={colors.primary}
        color2={colors.textTertiary}
        dataPointsColor1={colors.primary}
        dataPointsColor2={colors.textTertiary}
        dataPointsRadius={4}
        thickness={2}
        thickness2={2}
        hideRules
        yAxisColor="transparent"
        xAxisColor={colors.borderLight}
        yAxisTextStyle={{
          fontSize: 10,
          color: colors.textTertiary,
          fontFamily: Typography.fontFamily.regular,
        }}
        xAxisLabelTextStyle={{
          fontSize: 10,
          color: colors.textTertiary,
          fontFamily: Typography.fontFamily.regular,
        }}
        curved
        areaChart
        startFillColor1={`${colors.primary}20`}
        endFillColor1={`${colors.primary}05`}
        startFillColor2={`${colors.textTertiary}10`}
        endFillColor2={`${colors.textTertiary}02`}
        noOfSections={3}
        yAxisLabelPrefix="₹ "
      />
    </Card>
  );
};

export default TrendLineChart;
