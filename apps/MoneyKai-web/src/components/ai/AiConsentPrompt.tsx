import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface AiConsentPromptProps {
  onAccept: () => void;
  compact?: boolean;
}

export function AiConsentPrompt({ onAccept, compact = false }: AiConsentPromptProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="summary"
      style={{
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: BorderRadius.md,
        backgroundColor: colors.surface,
        padding: compact ? Spacing.sm : Spacing.md,
        gap: Spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
        <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.primary} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Allow AI for this session
          </Text>
          <Text style={{ marginTop: 3, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
            MoneyKai will send only the content needed for this AI request to the configured provider. AI output stays advisory and never changes records without your review.
          </Text>
        </View>
      </View>
      <Button title="Allow AI" variant="outline" size="sm" onPress={onAccept} />
    </View>
  );
}
