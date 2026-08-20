import React from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Transaction } from '@/types/transaction';
import { AnalyticsTransactionsTable } from './AnalyticsTransactionsTable';
import { MoneyRecordsCategoryModal } from './MoneyRecordsCategoryModal';
import { MoneyRecordsToolbar } from './MoneyRecordsToolbar';
import { MoneyReviewRail } from './MoneyReviewRail';
import { useMoneyRecordsWorkspace } from './useMoneyRecordsWorkspace';

interface Props {
  transactions: Transaction[];
  onViewAll: () => void;
  onExport: (transactions: Transaction[], scope: 'period' | 'selected') => void;
  onOpenAiReview: () => void;
  onOpenReports: () => void;
  onUpdateCategory: (transactionIds: string[], categoryId: string) => void;
}

export function MoneyRecordsWorkspace({ transactions, onViewAll, onExport, onOpenAiReview, onOpenReports, onUpdateCategory }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 1180;
  const compact = width < 760;
  const [reviewVisible, setReviewVisible] = React.useState(false);
  const [inlineReviewExpanded, setInlineReviewExpanded] = React.useState(false);
  const [categoryEditorVisible, setCategoryEditorVisible] = React.useState(false);
  const workspace = useMoneyRecordsWorkspace(transactions);

  const openReview = () => compact ? setReviewVisible(true) : setInlineReviewExpanded((current) => !current);
  const toggleTransaction = (id: string) => {
    workspace.toggleTransaction(id);
    if (!compact && !wide) setInlineReviewExpanded(true);
  };
  const toggleAllPreview = () => {
    workspace.toggleAllPreview();
    if (!compact && !wide) setInlineReviewExpanded(true);
  };
  const openCategoryEditor = () => {
    if (workspace.selectionSummary.hasMixedTypes || workspace.selectedTransactions.length === 0) return;
    setCategoryEditorVisible(true);
  };
  const applyCategory = (categoryId: string) => {
    onUpdateCategory(workspace.selectedTransactions.map((transaction) => transaction.id), categoryId);
    setCategoryEditorVisible(false);
    Alert.alert('Category updated', `${workspace.selectedTransactions.length} record${workspace.selectedTransactions.length === 1 ? '' : 's'} updated.`);
  };
  const reviewRail = (
    <MoneyReviewRail
      periodSummary={workspace.periodSummary}
      selectionSummary={workspace.selectionSummary}
      selectedCount={workspace.selectedIds.size}
      onClearSelection={workspace.clearSelection}
      onExportSelected={() => onExport(workspace.selectedTransactions, 'selected')}
      onEditCategory={openCategoryEditor}
      onOpenAiReview={onOpenAiReview}
      onOpenReports={onOpenReports}
    />
  );

  return (
    <View style={{ gap: Spacing.md }}>
      <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'flex-start' : 'stretch', gap: Spacing.md }}>
        <View style={{ flex: wide ? 2.5 : undefined, width: wide ? undefined : '100%', minWidth: 0, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.card, overflow: 'hidden' }}>
          <MoneyRecordsToolbar compact={!wide} recordCount={transactions.length} previewCount={workspace.previewTransactions.length} selectedCount={workspace.selectedIds.size} typeFilter={workspace.typeFilter} onChangeFilter={workspace.setTypeFilter} onReset={workspace.reset} onExport={() => onExport(transactions, 'period')} />
          <AnalyticsTransactionsTable transactions={workspace.previewTransactions} compact={compact} selectedIds={workspace.selectedIds} sortKey={workspace.sortKey} descending={workspace.descending} allSelected={workspace.allPreviewSelected} someSelected={workspace.somePreviewSelected} onToggleSort={workspace.toggleSort} onToggleTransaction={toggleTransaction} onToggleAll={toggleAllPreview} onViewAll={onViewAll} />
        </View>

        {wide ? <View style={[{ flex: 1, minWidth: 300, maxWidth: 410 }, Platform.OS === 'web' ? ({ position: 'sticky', top: 24 } as object) : null]}>{reviewRail}</View> : (
          <View style={{ gap: Spacing.sm }}>
            <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: compact ? reviewVisible : inlineReviewExpanded }} onPress={openReview} style={{ minHeight: 50, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: workspace.selectedIds.size > 0 ? colors.primary : colors.border, backgroundColor: workspace.selectedIds.size > 0 ? colors.primaryBg : colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}><MaterialCommunityIcons name={workspace.selectedIds.size > 0 ? 'checkbox-multiple-marked-outline' : 'clipboard-text-search-outline'} size={19} color={workspace.selectedIds.size > 0 ? colors.primary : colors.textSecondary} /><Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>{workspace.selectedIds.size > 0 ? `Review ${workspace.selectedIds.size} selected` : 'Review this period'}</Text></View>
              <MaterialCommunityIcons name={compact ? 'open-in-new' : inlineReviewExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            {!compact && inlineReviewExpanded ? reviewRail : null}
          </View>
        )}
      </View>

      <Modal visible={compact && reviewVisible} transparent animationType="slide" onRequestClose={() => setReviewVisible(false)}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close money review" onPress={() => setReviewVisible(false)} style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
          <Pressable accessibilityViewIsModal onPress={(event) => event.stopPropagation()} style={{ maxHeight: '88%', borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, backgroundColor: colors.card, padding: Spacing.md }}>
            <View style={{ alignItems: 'center', paddingBottom: Spacing.sm }}><View style={{ width: 44, height: 4, borderRadius: BorderRadius.full, backgroundColor: colors.border }} /></View>
            <ScrollView showsVerticalScrollIndicator>{reviewRail}</ScrollView>
            <TouchableOpacity accessibilityRole="button" onPress={() => setReviewVisible(false)} style={{ minHeight: 48, marginTop: Spacing.sm, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textSecondary }}>Close review</Text></TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <MoneyRecordsCategoryModal visible={categoryEditorVisible} transactionType={workspace.selectionSummary.transactionTypes[0] ?? null} selectedCount={workspace.selectedTransactions.length} onApply={applyCategory} onClose={() => setCategoryEditorVisible(false)} />
    </View>
  );
}
