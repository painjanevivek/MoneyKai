import React, { useState } from 'react';
import { Alert } from 'react-native';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Button } from '@/components/ui/Button';
import { AppText as Text } from '@/components/ui/AppText';
import { ActivityDateRange } from './ActivityDateRange';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionLabels } from '@/hooks/useTransactionLabels';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import { initialActivityDates, activityDateError, matchesActivityDate } from '@/utils/activityDates';
import { downloadTransactionCsv } from '@/services/transactionExport';

export function TransactionDownloadSheet({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const owner = useAuthStore(state => state.user?.id);
  const transactions = useTransactionStore(state => state.transactions);
  const displayName = useTransactionLabels();
  const [dates, setDates] = useState(initialActivityDates);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const count = transactions.filter(item => item.user_id === owner && matchesActivityDate(item.transaction_date, dates)).length;
  const save = async () => {
    if (!owner || saving) return;
    setSaving(true); setError('');
    try {
      const saved = await downloadTransactionCsv(useTransactionStore.getState().transactions, owner, dates, displayName);
      if (saved) { onClose(); Alert.alert('History downloaded', 'Your CSV was saved in the location you chose.'); }
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save this file. Try again.'); }
    finally { setSaving(false); }
  };
  return <ModalSheet visible title="Download history" onClose={saving ? () => undefined : onClose} footer={<Button title="Download CSV" icon="download" loading={saving} disabled={!count || Boolean(activityDateError(dates))} onPress={() => void save()} />}>
    <ActivityDateRange value={dates} onChange={setDates} />
    <Text style={{ color: colors.textSecondary, marginTop: Spacing.lg }}>{count} transactions · includes archived records</Text>
    <Text style={{ color: colors.textSecondary, marginTop: Spacing.sm }}>CSV files are not encrypted. Choose device storage to keep the file local; a cloud destination uploads through that provider.</Text>
    {error ? <Text accessibilityRole="alert" style={{ color: colors.error, marginTop: Spacing.md }}>{error}</Text> : null}
  </ModalSheet>;
}
