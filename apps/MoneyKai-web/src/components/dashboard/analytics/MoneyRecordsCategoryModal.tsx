import React from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { TransactionType } from '@/types/transaction';

interface Props {
  visible: boolean;
  transactionType: TransactionType | null;
  selectedCount: number;
  onApply: (categoryId: string) => void;
  onClose: () => void;
}

export function MoneyRecordsCategoryModal({ visible, transactionType, selectedCount, onApply, onClose }: Props) {
  const { colors } = useTheme();
  const categories = transactionType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close category editor" onPress={onClose} style={{ flex: 1, padding: Spacing.lg, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' }}>
        <Pressable accessibilityViewIsModal onPress={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '86%', borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: Spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.md }}>
            <View style={{ flex: 1 }}><Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>Edit category</Text><Text style={{ marginTop: 5, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>Apply one {transactionType ?? ''} category to {selectedCount} selected record{selectedCount === 1 ? '' : 's'}.</Text></View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close category editor" onPress={onClose} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="close" size={21} color={colors.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView style={{ marginTop: Spacing.lg }} contentContainerStyle={{ gap: Spacing.sm }}>
            {categories.map((category) => (
              <TouchableOpacity key={category.id} accessibilityRole="button" accessibilityLabel={`Apply ${category.name} to ${selectedCount} selected records`} onPress={() => onApply(category.id)} style={{ minHeight: 54, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}><View style={{ width: 34, height: 34, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: category.colorLight }}><MaterialCommunityIcons name={category.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={18} color={category.color} /></View><Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>{category.name}</Text></View>
                <MaterialCommunityIcons name="arrow-right" size={17} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
