import React from 'react';
import { Alert, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { isBackendConfigured } from '@/services/backendApi';
import { securityApi } from '@/services/securityApi';
import type { AuditEvent, SecurityChecklistItem, SecurityChecklistStatus, SecurityHardeningStatus } from '@/types/security';

const CONFIRM_DELETE = 'DELETE_FINANCIAL_DATA';

const statusMeta: Record<SecurityChecklistStatus, { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }> = {
  ready: { icon: 'check-circle-outline', label: 'Ready' },
  needs_config: { icon: 'alert-circle-outline', label: 'Needs config' },
  manual_review: { icon: 'clipboard-check-outline', label: 'Review' },
};

export const SecurityHardeningCard: React.FC = () => {
  const { colors } = useTheme();
  const backendConfigured = isBackendConfigured();
  const [status, setStatus] = React.useState<SecurityHardeningStatus | null>(null);
  const [auditEvents, setAuditEvents] = React.useState<AuditEvent[]>([]);
  const [busy, setBusy] = React.useState<'status' | 'audit' | 'delete' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('');

  const hydrateStatus = React.useCallback(async () => {
    if (!backendConfigured) {
      return;
    }
    try {
      setStatus(await securityApi.getHardeningStatus());
    } catch (error) {
      Alert.alert('Security status unavailable', error instanceof Error ? error.message : 'Could not load hardening status.');
    }
  }, [backendConfigured]);

  const refreshStatus = React.useCallback(async () => {
    setBusy('status');
    try {
      await hydrateStatus();
    } finally {
      setBusy(null);
    }
  }, [hydrateStatus]);

  React.useEffect(() => {
    if (!backendConfigured) {
      return;
    }

    let cancelled = false;

    async function loadInitialStatus() {
      try {
        const nextStatus = await securityApi.getHardeningStatus();
        if (!cancelled) {
          setStatus(nextStatus);
        }
      } catch (error) {
        if (!cancelled) {
          Alert.alert('Security status unavailable', error instanceof Error ? error.message : 'Could not load hardening status.');
        }
      }
    }

    void loadInitialStatus();

    return () => {
      cancelled = true;
    };
  }, [backendConfigured]);

  const loadAuditEvents = async () => {
    setBusy('audit');
    try {
      setAuditEvents(await securityApi.listAuditEvents());
    } catch (error) {
      Alert.alert('Audit log unavailable', error instanceof Error ? error.message : 'Could not load audit events.');
    } finally {
      setBusy(null);
    }
  };

  const deleteFinancialData = async () => {
    if (deleteConfirmText !== CONFIRM_DELETE) {
      Alert.alert('Confirmation required', `Type ${CONFIRM_DELETE} to delete imported financial data.`);
      return;
    }
    setBusy('delete');
    try {
      const response = await securityApi.deleteFinancialData();
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      await hydrateStatus();
      Alert.alert('Financial data deleted', `${response.collectionsCleared.length} financial collections were cleared.`);
    } catch (error) {
      Alert.alert('Delete failed', error instanceof Error ? error.message : 'Could not delete financial data.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Card style={{ marginBottom: Spacing.md, gap: Spacing.md }} variant="outlined">
        <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: BorderRadius.sm,
              backgroundColor: colors.primaryBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="shield-key-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Security hardening
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
              Backend checklist, retention settings, audit events, and financial-data deletion controls.
            </Text>
          </View>
        </View>

        {!backendConfigured ? (
          <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
            Backend API is not configured for this build.
          </Text>
        ) : null}

        {status ? (
          <View style={{ gap: Spacing.sm }}>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
              {status.environment} | raw docs {status.rawDocumentRetentionDays}d | audits {status.auditRetentionDays}d
            </Text>
            {status.checklist.map((item) => (
              <ChecklistRow key={item.key} item={item} />
            ))}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          <Button
            title="Refresh"
            icon="refresh"
            variant="outline"
            loading={busy === 'status'}
            disabled={!backendConfigured}
            onPress={refreshStatus}
            style={{ flexGrow: 1 }}
          />
          <Button
            title="Audit"
            icon="clipboard-text-clock-outline"
            variant="outline"
            loading={busy === 'audit'}
            disabled={!backendConfigured}
            onPress={loadAuditEvents}
            style={{ flexGrow: 1 }}
          />
        </View>

        {auditEvents.length > 0 ? (
          <View style={{ gap: Spacing.xs }}>
            {auditEvents.slice(0, 3).map((event) => (
              <Text key={event.id} style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                {event.eventType} | {new Date(event.createdAt).toLocaleString()}
              </Text>
            ))}
          </View>
        ) : null}

        <Button
          title="Delete Financial Data"
          icon="trash-can-outline"
          variant="danger"
          disabled={!backendConfigured}
          onPress={() => setShowDeleteConfirm(true)}
        />
      </Card>

      <ModalSheet
        visible={showDeleteConfirm}
        title="Delete financial data"
        subtitle="This clears imported financial accounts, statements, holdings, transactions, reviews, and related metadata."
        onClose={() => setShowDeleteConfirm(false)}
        footer={
          <View style={{ gap: Spacing.sm }}>
            <Button
              title="Delete Financial Data"
              icon="trash-can-outline"
              variant="danger"
              loading={busy === 'delete'}
              disabled={deleteConfirmText !== CONFIRM_DELETE}
              onPress={deleteFinancialData}
            />
            <Button title="Cancel" variant="outline" onPress={() => setShowDeleteConfirm(false)} />
          </View>
        }
      >
        <Input
          label="Type DELETE_FINANCIAL_DATA"
          value={deleteConfirmText}
          onChangeText={setDeleteConfirmText}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder={CONFIRM_DELETE}
        />
      </ModalSheet>
    </>
  );
};

const ChecklistRow: React.FC<{ item: SecurityChecklistItem }> = ({ item }) => {
  const { colors } = useTheme();
  const meta = statusMeta[item.status];
  const color = item.status === 'ready' ? colors.success : item.status === 'needs_config' ? colors.warning : colors.primary;

  return (
    <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
      <MaterialCommunityIcons name={meta.icon} size={18} color={color} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
          {item.label}
        </Text>
        <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
          {meta.label}: {item.detail}
        </Text>
      </View>
    </View>
  );
};
