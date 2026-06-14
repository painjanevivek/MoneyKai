import React from 'react';
import { Switch, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { FinancialDocument } from '@/types/financialDocument';

interface PdfPasswordPromptSheetProps {
  document?: FinancialDocument;
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (password: string, saveForProvider: boolean) => void;
}

export const PdfPasswordPromptSheet: React.FC<PdfPasswordPromptSheetProps> = ({
  document,
  visible,
  loading = false,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();
  const [password, setPassword] = React.useState('');
  const [saveForProvider, setSaveForProvider] = React.useState(false);

  return (
    <ModalSheet
      visible={visible}
      title="PDF password"
      subtitle={document ? document.filename : 'Enter the statement password provided by your bank or broker.'}
      onClose={onClose}
      footer={
        <View style={{ gap: Spacing.sm }}>
          <Button
            title="Unlock and Parse"
            icon="lock-open-outline"
            onPress={() => onSubmit(password, saveForProvider)}
            loading={loading}
            disabled={password.trim().length === 0}
          />
          <Button title="Cancel" onPress={onClose} variant="outline" disabled={loading} />
        </View>
      }
    >
      <View style={{ gap: Spacing.md }}>
        <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
          MoneyKai tries only the password you enter for this document. It does not guess or brute force statement passwords.
        </Text>
        <Input
          label="Statement password"
          placeholder="Enter PDF password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Save for this provider
            </Text>
            <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textTertiary }}>
              Stored server-side only if you choose it, encrypted at rest.
            </Text>
          </View>
          <Switch
            value={saveForProvider}
            onValueChange={setSaveForProvider}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.textInverse}
          />
        </View>
      </View>
    </ModalSheet>
  );
};
