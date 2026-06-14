import React from 'react';
import { Alert, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { PortfolioAssetType, PortfolioHoldingDraft } from '@/types/portfolio';

const ASSET_OPTIONS: { value: PortfolioAssetType; label: string }[] = [
  { value: 'equity', label: 'Equity' },
  { value: 'mutual_fund', label: 'Fund' },
  { value: 'fd', label: 'FD' },
  { value: 'gold', label: 'Gold' },
  { value: 'cash', label: 'Cash' },
  { value: 'loan', label: 'Loan' },
  { value: 'credit_card', label: 'Card Debt' },
  { value: 'other', label: 'Other' },
];

interface ManualHoldingSheetProps {
  visible: boolean;
  currencySymbol: string;
  loading: boolean;
  onClose: () => void;
  onSubmit: (payload: PortfolioHoldingDraft) => Promise<void>;
}

export const ManualHoldingSheet: React.FC<ManualHoldingSheetProps> = ({
  visible,
  currencySymbol,
  loading,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();
  const [assetType, setAssetType] = React.useState<PortfolioAssetType>('equity');
  const [name, setName] = React.useState('');
  const [symbol, setSymbol] = React.useState('');
  const [quantity, setQuantity] = React.useState('1');
  const [investedValue, setInvestedValue] = React.useState('');
  const [currentValue, setCurrentValue] = React.useState('');

  const handleSubmit = async () => {
    const parsedQuantity = Number(quantity || '1');
    const parsedCurrentValue = Number(currentValue);
    const parsedInvestedValue = investedValue.trim().length > 0 ? Number(investedValue) : undefined;

    if (!name.trim()) {
      Alert.alert('Name required', 'Add a name for this asset or liability.');
      return;
    }
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      Alert.alert('Invalid quantity', 'Quantity must be zero or higher.');
      return;
    }
    if (!Number.isFinite(parsedCurrentValue) || parsedCurrentValue < 0) {
      Alert.alert('Invalid value', 'Current value must be zero or higher.');
      return;
    }
    if (parsedInvestedValue !== undefined && (!Number.isFinite(parsedInvestedValue) || parsedInvestedValue < 0)) {
      Alert.alert('Invalid invested value', 'Invested value must be zero or higher.');
      return;
    }

    await onSubmit({
      assetType,
      name: name.trim(),
      symbol: symbol.trim() || undefined,
      quantity: parsedQuantity,
      investedValue: parsedInvestedValue,
      currentValue: parsedCurrentValue,
      source: 'manual',
    });
  };

  return (
    <ModalSheet
      visible={visible}
      title="Manual entry"
      subtitle="Track assets and liabilities that are not connected through a provider yet."
      onClose={onClose}
      footer={
        <View style={{ gap: Spacing.sm }}>
          <Button title="Add to Wealth" icon="plus" loading={loading} onPress={handleSubmit} />
          <Button title="Cancel" variant="outline" onPress={onClose} disabled={loading} />
        </View>
      }
    >
      <View style={{ gap: Spacing.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {ASSET_OPTIONS.map((option) => {
            const selected = option.value === assetType;
            return (
              <Button
                key={option.value}
                title={option.label}
                size="sm"
                variant={selected ? 'secondary' : 'outline'}
                onPress={() => setAssetType(option.value)}
                style={{ borderRadius: BorderRadius.sm }}
              />
            );
          })}
        </View>
        <Input label="Name" value={name} onChangeText={setName} placeholder="HDFC Bank shares, home loan, cash" />
        <Input label="Symbol or folio" value={symbol} onChangeText={setSymbol} placeholder="Optional" autoCapitalize="characters" />
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <Input
            label="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            inputMode="decimal"
            style={{ flex: 1 }}
          />
          <Input
            label="Current value"
            value={currentValue}
            onChangeText={setCurrentValue}
            keyboardType="decimal-pad"
            inputMode="decimal"
            prefix={currencySymbol}
            style={{ flex: 1 }}
          />
        </View>
        <Input
          label="Invested value"
          value={investedValue}
          onChangeText={setInvestedValue}
          keyboardType="decimal-pad"
          inputMode="decimal"
          prefix={currencySymbol}
          placeholder="Defaults to current value"
        />
        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary, lineHeight: 18 }}>
          Loans and credit card debt count toward liabilities while assets count toward net worth.
        </Text>
      </View>
    </ModalSheet>
  );
};
