import React from 'react';
import type { Transaction } from '@/types/transaction';
import {
  filterAndSortMoneyRecords,
  getSelectedMoneyRecords,
  summarizeMoneyRecords,
} from './moneyRecordsSelectors';
import type { MoneyRecordsSortKey, MoneyRecordsTypeFilter } from './moneyRecords.types';

const PREVIEW_ROW_LIMIT = 8;

export function useMoneyRecordsWorkspace(transactions: readonly Transaction[]) {
  const [typeFilter, setTypeFilter] = React.useState<MoneyRecordsTypeFilter>('all');
  const [sortKey, setSortKey] = React.useState<MoneyRecordsSortKey>('date');
  const [descending, setDescending] = React.useState(true);
  const [selection, setSelection] = React.useState<Set<string>>(() => new Set());

  const filteredTransactions = React.useMemo(
    () => filterAndSortMoneyRecords(transactions, typeFilter, sortKey, descending),
    [descending, sortKey, transactions, typeFilter],
  );
  const previewTransactions = React.useMemo(
    () => filteredTransactions.slice(0, PREVIEW_ROW_LIMIT),
    [filteredTransactions],
  );

  const selectedIds = React.useMemo(() => {
    const visibleIds = new Set(previewTransactions.map((transaction) => transaction.id));
    return new Set([...selection].filter((id) => visibleIds.has(id)));
  }, [previewTransactions, selection]);

  const selectedTransactions = React.useMemo(
    () => getSelectedMoneyRecords(previewTransactions, selectedIds),
    [previewTransactions, selectedIds],
  );
  const periodSummary = React.useMemo(() => summarizeMoneyRecords(transactions), [transactions]);
  const selectionSummary = React.useMemo(
    () => summarizeMoneyRecords(selectedTransactions),
    [selectedTransactions],
  );
  const allPreviewSelected = previewTransactions.length > 0 && previewTransactions.every((transaction) => selectedIds.has(transaction.id));
  const somePreviewSelected = selectedIds.size > 0 && !allPreviewSelected;

  const toggleSort = React.useCallback((key: MoneyRecordsSortKey) => {
    if (key === sortKey) setDescending((current) => !current);
    else {
      setSortKey(key);
      setDescending(true);
    }
  }, [sortKey]);

  const toggleTransaction = React.useCallback((id: string) => {
    setSelection((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllPreview = React.useCallback(() => {
    setSelection((current) => {
      if (previewTransactions.length > 0 && previewTransactions.every((transaction) => current.has(transaction.id))) {
        return new Set();
      }
      return new Set(previewTransactions.map((transaction) => transaction.id));
    });
  }, [previewTransactions]);

  const clearSelection = React.useCallback(() => setSelection(new Set()), []);
  const changeTypeFilter = React.useCallback((filter: MoneyRecordsTypeFilter) => {
    setTypeFilter(filter);
    setSelection(new Set());
  }, []);
  const reset = React.useCallback(() => {
    setTypeFilter('all');
    setSortKey('date');
    setDescending(true);
    setSelection(new Set());
  }, []);

  return {
    typeFilter,
    setTypeFilter: changeTypeFilter,
    sortKey,
    descending,
    selectedIds,
    filteredTransactions,
    previewTransactions,
    selectedTransactions,
    periodSummary,
    selectionSummary,
    allPreviewSelected,
    somePreviewSelected,
    toggleSort,
    toggleTransaction,
    toggleAllPreview,
    clearSelection,
    reset,
  };
}
