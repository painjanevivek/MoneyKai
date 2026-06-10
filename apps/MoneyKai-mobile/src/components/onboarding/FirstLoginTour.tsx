import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

type TourStep = {
  icon: string;
  title: string;
  body: string;
  hint: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    icon: 'view-dashboard-outline',
    title: 'Start on the Dashboard',
    body: 'This is your quick financial snapshot. Check balances, trends, notes, and recent activity here first.',
    hint: 'Look here for your daily overview.',
  },
  {
    icon: 'receipt-text-outline',
    title: 'Use Transactions for everyday entries',
    body: 'Add spending and income from the Transactions tab when you need to record something right away.',
    hint: 'This is where your history grows.',
  },
  {
    icon: 'text-box-check-outline',
    title: 'Review Transaction Capture drafts',
    body: 'Auto Capture is optional. When you enable Android notification access, MoneyKai creates reviewable drafts from supported transaction alerts instead of adding transactions automatically.',
    hint: 'Review drafts before they affect your budget.',
  },
  {
    icon: 'account-group-outline',
    title: 'Track shared expenses in Groups',
    body: 'Rooms, trips, and shared bills belong in Groups so you can split costs without messy calculations.',
    hint: 'Open Groups when money is shared.',
  },
  {
    icon: 'chart-line',
    title: 'Review patterns in Savings',
    body: 'Savings now contains the analytics and challenge view, so the deeper insights live in one calmer place.',
    hint: 'Savings is where the analysis lives.',
  },
  {
    icon: 'cog-outline',
    title: 'Finish in Settings',
    body: 'Monthly budget, backups, privacy, Android notification access, and account actions all live in Settings when you need them.',
    hint: 'Settings keeps the important controls together.',
  },
];

interface FirstLoginTourProps {
  visible: boolean;
  onFinish: () => void;
  onSkip: () => void;
}

export const FirstLoginTour: React.FC<FirstLoginTourProps> = ({ visible, onFinish, onSkip }) => {
  const { colors } = useTheme();
  const [stepIndex, setStepIndex] = useState(0);

  const step = TOUR_STEPS[stepIndex];
  const isLastStep = stepIndex === TOUR_STEPS.length - 1;

  return (
    <ModalSheet
      visible={visible}
      title="Welcome to MoneyKai"
      subtitle="A quick guided tour so the app feels familiar from the first login."
      onClose={onSkip}
      maxHeight={620}
      footer={
        <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
          <Button
            title={isLastStep ? 'Finish tour' : 'Next'}
            onPress={() => {
              if (isLastStep) {
                onFinish();
                return;
              }
              setStepIndex((current) => Math.min(current + 1, TOUR_STEPS.length - 1));
            }}
            fullWidth
          />
          <Button title="Skip for now" onPress={onSkip} variant="outline" fullWidth />
        </View>
      }
    >
      <View style={{ gap: Spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.primaryBg,
            borderRadius: BorderRadius.md,
            padding: Spacing.md,
            borderWidth: 1,
            borderColor: `${colors.primary}20`,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialCommunityIcons name={step.icon as any} size={22} color={colors.textInverse} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                {step.title}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>
                {step.hint}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.primary }}>
            {stepIndex + 1}/{TOUR_STEPS.length}
          </Text>
        </View>

        <Card>
          <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22 }}>
            {step.body}
          </Text>
        </Card>

        <View style={{ gap: Spacing.sm }}>
          {TOUR_STEPS.map((item, index) => {
            const active = index === stepIndex;
            return (
              <TouchableOpacity
                key={item.title}
                onPress={() => setStepIndex(index)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: Spacing.md,
                  borderRadius: BorderRadius.md,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primaryBg : colors.surface,
                }}
              >
                <MaterialCommunityIcons name={item.icon as any} size={18} color={active ? colors.primary : colors.textTertiary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>
                    {item.hint}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ModalSheet>
  );
};

export default FirstLoginTour;
