import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { calculateBudgetHealth, getBudgetHealthColor } from '../../utils/savingsEngine';
import { Typography, Spacing } from '../../constants/theme';

const GAUGE_MARKS = [0, 25, 50, 75, 100];
const GAUGE_CENTER = { x: 130, y: 122 };
const GAUGE_RADIUS = 82;
const GAUGE_SEGMENTS = [
  { start: 0, end: 35, color: '#EF4444' },
  { start: 35, end: 65, color: '#F59E0B' },
  { start: 65, end: 100, color: '#10B981' },
];
const clampScore = (value: number) => Math.max(0, Math.min(100, value));
const polarPoint = (score: number, radius: number) => {
  const angle = 180 - (clampScore(score) / 100) * 180;
  const radians = (angle * Math.PI) / 180;
  return {
    x: GAUGE_CENTER.x + radius * Math.cos(radians),
    y: GAUGE_CENTER.y - radius * Math.sin(radians),
  };
};

const describeArc = (startScore: number, endScore: number, radius: number) => {
  const start = polarPoint(startScore, radius);
  const end = polarPoint(endScore, radius);
  const largeArcFlag = endScore - startScore > 50 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

const gaugeLabelPosition = (mark: number) => {
  if (mark === 0) {
    return { left: -34, top: 106 };
  }

  if (mark === 100) {
    return { left: 252, top: 106 };
  }

  const point = polarPoint(mark, 112);
  return {
    left: Math.max(0, Math.min(218, point.x - 21)),
    top: Math.max(0, Math.min(148, point.y - 10)),
  };
};

export const BudgetHealth: React.FC<{ totalSpent?: number }> = ({ totalSpent: totalSpentProp }) => {
  const { colors } = useTheme();
  const storeTotalSpent = useTransactionStore((s) => s.getTotalSpent());
  const { settings } = useBudgetStore();
  const totalSpent = totalSpentProp ?? storeTotalSpent;
  const health = calculateBudgetHealth(settings.monthly_allowance, totalSpent);
  const healthColor = getBudgetHealthColor(health.level, colors);
  const score = clampScore(health.score);
  const needleEnd = polarPoint(score, 66);

  return (
    <Card
      style={{
        borderWidth: 1,
        borderColor: colors.borderLight,
      }}
    >
      <Text style={{
        fontSize: Typography.fontSize.md,
        lineHeight: 22,
        fontFamily: Typography.fontFamily.semiBold,
        color: colors.textPrimary,
        marginBottom: Spacing.md,
      }}>Budget Health</Text>

      <View style={{ alignItems: 'center', marginBottom: Spacing.md }}>
        <View style={{ width: 260, height: 172, overflow: 'visible' }}>
          <Svg width={260} height={172} viewBox="0 0 260 172">
            <Path
              d={describeArc(0, 100, GAUGE_RADIUS)}
              stroke={colors.borderLight}
              strokeWidth={18}
              strokeLinecap="round"
              fill="none"
            />
            {GAUGE_SEGMENTS.map((segment) => (
              <Path
                key={`${segment.start}-${segment.end}`}
                d={describeArc(segment.start, segment.end, GAUGE_RADIUS)}
                stroke={segment.color}
                strokeWidth={18}
                strokeLinecap="round"
                opacity={0.9}
                fill="none"
              />
            ))}
            <G>
              {GAUGE_MARKS.map((mark) => {
                const inner = polarPoint(mark, 96);
                const outer = polarPoint(mark, 108);
                return (
                  <Line
                    key={mark}
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                    stroke={colors.textSecondary}
                    strokeWidth={mark % 50 === 0 ? 2 : 1.5}
                    strokeLinecap="round"
                  />
                );
              })}
            </G>
            <Line
              x1={GAUGE_CENTER.x}
              y1={GAUGE_CENTER.y}
              x2={needleEnd.x}
              y2={needleEnd.y}
              stroke={colors.textPrimary}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <Circle
              cx={GAUGE_CENTER.x}
              cy={GAUGE_CENTER.y}
              r="9"
              fill={colors.card}
              stroke={healthColor}
              strokeWidth="3"
            />
          </Svg>
          {GAUGE_MARKS.map((mark) => {
            const position = gaugeLabelPosition(mark);
            return (
              <Text
                key={mark}
                style={{
                  position: 'absolute',
                  left: position.left,
                  top: position.top,
                  width: 42,
                  fontSize: 12,
                  lineHeight: 16,
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.textSecondary,
                  textAlign: 'center',
                }}
              >
                {mark}
              </Text>
            );
          })}
        </View>

        <View style={{
          marginTop: -58,
          alignItems: 'center',
        }}>
          <View style={{
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: `${healthColor}66`,
          }}>
            <MaterialCommunityIcons
              name={health.score >= 60 ? 'heart' : health.score >= 30 ? 'heart-half-full' : 'heart-broken'}
              size={24}
              color={healthColor}
            />
          </View>
        </View>
      </View>

      <View style={{ alignItems: 'center' }}>
        <Text style={{
          fontSize: Typography.fontSize.xl,
          lineHeight: 28,
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
          maxWidth: 260,
        }}>{health.message}</Text>
      </View>
    </Card>
  );
};

export default BudgetHealth;
