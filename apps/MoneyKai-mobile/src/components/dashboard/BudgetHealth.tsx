import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { calculateBudgetHealth, getBudgetHealthColor } from '../../utils/savingsEngine';
import { Typography, Spacing } from '../../constants/theme';

const GAUGE_MARKS = [0, 25, 50, 75, 100];
const clampScore = (value: number) => Math.max(0, Math.min(100, value));
const polarPoint = (score: number, radius: number) => {
  const angle = 180 - (clampScore(score) / 100) * 180;
  const radians = (angle * Math.PI) / 180;
  return {
    x: 130 + radius * Math.cos(radians),
    y: 126 - radius * Math.sin(radians),
  };
};

const describeArc = (startScore: number, endScore: number, radius: number) => {
  const start = polarPoint(startScore, radius);
  const end = polarPoint(endScore, radius);
  const largeArcFlag = endScore - startScore > 50 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

export const BudgetHealth: React.FC<{ totalSpent?: number }> = ({ totalSpent: totalSpentProp }) => {
  const { colors } = useTheme();
  const storeTotalSpent = useTransactionStore((s) => s.getTotalSpent());
  const { settings } = useBudgetStore();
  const totalSpent = totalSpentProp ?? storeTotalSpent;
  const health = calculateBudgetHealth(settings.monthly_allowance, totalSpent);
  const healthColor = getBudgetHealthColor(health.level, colors);
  const trackColor = colors.border;
  const score = clampScore(health.score);

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
        <Svg width={260} height={158} viewBox="0 0 260 158">
          <Path
            d={describeArc(0, 100, 82)}
            stroke={trackColor}
            strokeWidth={16}
            strokeLinecap="butt"
            fill="none"
          />
          {score > 0 ? (
            <Path
              d={describeArc(0, score, 82)}
              stroke={healthColor}
              strokeWidth={16}
              strokeLinecap="butt"
              fill="none"
            />
          ) : null}
          <G>
            {GAUGE_MARKS.map((mark) => {
              const inner = polarPoint(mark, 94);
              const outer = polarPoint(mark, 104);
              const label = polarPoint(mark, 120);
              return (
                <G key={mark}>
                  <Line
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                    stroke={colors.textTertiary}
                    strokeWidth={mark % 50 === 0 ? 2 : 1.5}
                    strokeLinecap="round"
                  />
                  <SvgText
                    x={label.x}
                    y={label.y + 4}
                    fill={colors.textTertiary}
                    fontSize="11"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {mark}
                  </SvgText>
                </G>
              );
            })}
          </G>
          <Circle
            cx="130"
            cy="126"
            r="42"
            fill={`${healthColor}18`}
            stroke={`${healthColor}36`}
            strokeWidth="1"
          />
        </Svg>

        {/* Score */}
        <View style={{
          marginTop: -66,
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
