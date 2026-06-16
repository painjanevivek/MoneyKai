import React, { useState } from 'react';
import { router } from 'expo-router';
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
    title: 'Start with the control center',
    body: 'The dashboard is the calm first read: available money, spend pressure, income, recent records, and the next best place to review.',
    hint: 'Your daily decision surface.',
  },
  {
    icon: 'receipt-text-outline',
    title: 'Build a reviewed ledger',
    body: 'Transactions are the source of truth for reports. Add records manually, review imported entries, and keep categories clean.',
    hint: 'Every report starts here.',
  },
  {
    icon: 'database-import-outline',
    title: 'Import only what you choose',
    body: 'MoneyKai is built around user-provided records: statements, pasted messages, documents, and manual entries you can review.',
    hint: 'No hidden capture workflow.',
  },
  {
    icon: 'briefcase-outline',
    title: 'Add wealth context',
    body: 'Portfolio records and holdings help connect day-to-day money decisions with longer-term allocation and exposure.',
    hint: 'Spending plus wealth context.',
  },
  {
    icon: 'shield-check-outline',
    title: 'Keep trust visible',
    body: 'Privacy, backups, budget settings, and account controls stay close to the workflows that depend on them.',
    hint: 'Trust is a product behavior.',
  },
  {
    icon: 'receipt-text-plus-outline',
    title: 'Add one record to begin',
    body: 'Your first useful MoneyKai review starts with a single income or expense. Add one record now, then return to the dashboard to see the loop take shape.',
    hint: 'First action: one reviewed record.',
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
      title="Set up your MoneyKai workspace"
      subtitle="A quick tour of the financial review loop, ending with the first record that makes the product useful."
      onClose={onSkip}
      maxHeight={620}
      footer={
        <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
          <Button
            title={isLastStep ? 'Add first record' : 'Next'}
            icon={isLastStep ? 'receipt-text-plus-outline' : undefined}
            onPress={() => {
              if (isLastStep) {
                onFinish();
                router.push('/transactions' as any);
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
            backgroundColor: colors.primaryDark,
            borderRadius: BorderRadius.md,
            padding: Spacing.md,
            borderWidth: 1,
            borderColor: `${colors.primary}30`,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(255,255,255,0.14)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.16)',
              }}
            >
              <MaterialCommunityIcons name={step.icon as any} size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' }}>
                {step.title}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.68)', marginTop: 2, lineHeight: 18 }}>
                {step.hint}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: 'rgba(255,255,255,0.74)' }}>
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
