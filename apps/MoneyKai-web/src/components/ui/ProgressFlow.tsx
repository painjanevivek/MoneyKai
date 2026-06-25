import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { withAlpha } from '@/utils/glassStyle';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';
import type { ProgressFlowStatus, ProgressFlowStep } from '@/hooks/useStagedProgress';

type ProgressFlowProps = {
  activeStepIndex: number;
  cancelLabel?: string;
  errorMessage?: string | null;
  onCancel?: () => void;
  onRetry?: () => void;
  progress: number;
  retryLabel?: string;
  status: ProgressFlowStatus;
  steps: ProgressFlowStep[];
  successMessage?: string;
  title: string;
};

const getStepIcon = (
  index: number,
  activeStepIndex: number,
  status: ProgressFlowStatus,
): keyof typeof MaterialCommunityIcons.glyphMap => {
  if (status === 'failed' && index === activeStepIndex) return 'alert-circle-outline';
  if (status === 'success' || index < activeStepIndex) return 'check-circle-outline';
  if (index === activeStepIndex) return 'progress-clock';
  return 'circle-outline';
};

export const ProgressFlow: React.FC<ProgressFlowProps> = ({
  activeStepIndex,
  cancelLabel = 'Cancel',
  errorMessage,
  onCancel,
  onRetry,
  progress,
  retryLabel = 'Retry',
  status,
  steps,
  successMessage = 'Complete',
  title,
}) => {
  const { colors } = useTheme();
  const activeStep = steps[activeStepIndex] ?? steps[0];
  const isRunning = status === 'running';
  const isFailed = status === 'failed';
  const isSuccess = status === 'success';
  const toneColor = isFailed ? colors.error : isSuccess ? colors.success : colors.primary;

  if (status === 'idle') {
    return null;
  }

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={title}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
      style={{
        gap: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: withAlpha(toneColor, 0.3),
        backgroundColor: withAlpha(toneColor, 0.08),
        padding: Spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: BorderRadius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: withAlpha(toneColor, 0.14),
          }}
        >
          {isRunning ? (
            <ActivityIndicator size="small" color={toneColor} />
          ) : (
            <MaterialCommunityIcons
              name={isFailed ? 'alert-circle-outline' : 'check-circle-outline'}
              size={19}
              color={toneColor}
            />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontFamily: Typography.fontFamily.semiBold,
              color: colors.textPrimary,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              marginTop: 2,
              fontSize: Typography.fontSize.xs,
              lineHeight: 18,
              color: colors.textSecondary,
            }}
          >
            {isFailed ? errorMessage : isSuccess ? successMessage : activeStep?.label}
          </Text>
        </View>
      </View>

      <ProgressBar progress={progress} color={toneColor} height={7} />

      <View style={{ gap: Spacing.xs }}>
        {steps.map((step, index) => {
          const isActive = index === activeStepIndex;
          const icon = getStepIcon(index, activeStepIndex, status);
          return (
            <View
              key={step.id}
              style={{
                flexDirection: 'row',
                gap: Spacing.sm,
                alignItems: 'flex-start',
                opacity: isActive || index < activeStepIndex || isSuccess ? 1 : 0.58,
              }}
            >
              <MaterialCommunityIcons
                name={icon}
                size={16}
                color={index <= activeStepIndex || isSuccess ? toneColor : colors.textTertiary}
                style={{ marginTop: 1 }}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.xs,
                    fontFamily: isActive ? Typography.fontFamily.semiBold : Typography.fontFamily.medium,
                    color: isActive ? colors.textPrimary : colors.textSecondary,
                  }}
                >
                  {step.label}
                </Text>
                {step.detail ? (
                  <Text
                    style={{
                      marginTop: 1,
                      fontSize: 11,
                      lineHeight: 15,
                      color: colors.textTertiary,
                    }}
                  >
                    {step.detail}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      {isFailed || onCancel ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {isFailed && onRetry ? (
            <Button title={retryLabel} icon="refresh" onPress={onRetry} size="sm" />
          ) : null}
          {onCancel && isRunning ? (
            <Button title={cancelLabel} variant="outline" onPress={onCancel} size="sm" />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

export default ProgressFlow;
