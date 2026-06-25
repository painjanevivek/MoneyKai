import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';
import type { ProgressFlowState, ProgressFlowStep } from '@/services/progressIllusion';

interface ProgressFlowCardProps {
  flow: ProgressFlowState;
  onRetry?: () => void;
  onCancel?: () => void;
  onBackground?: () => void;
}

const iconForStep = (step: ProgressFlowStep) => {
  switch (step.status) {
    case 'complete':
      return 'check-circle';
    case 'failed':
      return 'alert-circle-outline';
    case 'active':
      return 'progress-clock';
    case 'pending':
    default:
      return 'circle-outline';
  }
};

export function ProgressFlowCard({ flow, onRetry, onCancel, onBackground }: ProgressFlowCardProps) {
  const { colors } = useTheme();
  const isRunning = flow.status === 'running' || flow.status === 'background';
  const toneColor = flow.status === 'failed' ? colors.error : flow.status === 'success' ? colors.success : colors.primary;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={flow.title}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(flow.progress), text: flow.currentStep }}
      style={{
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: flow.status === 'failed' ? colors.error : colors.borderLight,
        backgroundColor: colors.surfaceElevated,
        padding: Spacing.md,
        gap: Spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: BorderRadius.sm,
            backgroundColor: flow.status === 'failed' ? colors.emergencyBg : colors.primaryBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isRunning ? (
            <ActivityIndicator size="small" color={toneColor} />
          ) : (
            <MaterialCommunityIcons
              name={flow.status === 'success' ? 'check-circle' : 'alert-circle-outline'}
              size={22}
              color={toneColor}
            />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            {flow.title}
          </Text>
          <Text style={{ marginTop: 3, fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
            {flow.currentStep}
          </Text>
          {flow.detail ? (
            <Text style={{ marginTop: 3, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textTertiary }}>
              {flow.detail}
            </Text>
          ) : null}
        </View>
      </View>

      <ProgressBar progress={flow.progress} color={toneColor} height={8} />

      <View style={{ gap: Spacing.sm }}>
        {flow.steps.map((step) => (
          <View key={step.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
            <MaterialCommunityIcons
              name={iconForStep(step)}
              size={18}
              color={
                step.status === 'complete'
                  ? colors.success
                  : step.status === 'failed'
                    ? colors.error
                    : step.status === 'active'
                      ? colors.primary
                      : colors.textTertiary
              }
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                {step.title}
              </Text>
              {step.description ? (
                <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 17, color: colors.textSecondary }}>
                  {step.description}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {onRetry || onCancel || onBackground ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {flow.status === 'failed' && onRetry ? (
            <Button title="Retry" icon="refresh" size="sm" onPress={onRetry} style={{ flexGrow: 1 }} />
          ) : null}
          {isRunning && onBackground ? (
            <Button title="Run in background" icon="clock-outline" size="sm" variant="secondary" onPress={onBackground} style={{ flexGrow: 1 }} />
          ) : null}
          {isRunning && onCancel ? (
            <Button title="Cancel" icon="close" size="sm" variant="outline" onPress={onCancel} style={{ flexGrow: 1 }} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
