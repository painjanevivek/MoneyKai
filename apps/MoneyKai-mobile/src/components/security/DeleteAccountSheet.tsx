import React, { useRef, useState } from 'react';
import { Linking, TextInput, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { PressableScale } from '@/components/ui/PressableScale';
import { SITE } from '@/constants/site';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { deleteMoneyKaiAccount } from '@/services/accountDeletion';
import { isBackendConfigured } from '@/services/backendApi';
import { usePriceMemoryStore } from '@/stores/usePriceMemoryStore';
import { useAuthStore } from '@/stores/useAuthStore';

type Props = {
  visible: boolean;
  onClose: () => void;
  signOut: () => Promise<void>;
};

export function DeleteAccountSheet({ visible, onClose, signOut }: Props) {
  const { colors } = useTheme();
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const requestKey = useRef<string | null>(null);

  const close = () => {
    if (busy) return;
    setConfirmation('');
    setError('');
    onClose();
  };

  const deleteAccount = async () => {
    if (busy || confirmation.trim() !== 'DELETE') return;
    requestKey.current ??= `account-delete-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    setBusy(true);
    setError('');
    try {
      const ownerId = useAuthStore.getState().user?.id;
      await deleteMoneyKaiAccount(requestKey.current, async () => {
        if (ownerId) usePriceMemoryStore.getState().clearOwner(ownerId);
        await signOut();
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Account deletion could not be verified. Please retry or contact support.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalSheet
      visible={visible}
      title="Delete account"
      subtitle="Permanently remove your MoneyKai account and synced data"
      onClose={close}
      maxHeight={620}
      footer={
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <Button title="Cancel" variant="outline" onPress={close} disabled={busy} style={{ flex: 1 }} />
          <Button
            title="Delete account"
            variant="danger"
            onPress={() => void deleteAccount()}
            disabled={busy || confirmation.trim() !== 'DELETE' || !isBackendConfigured()}
            loading={busy}
            style={{ flex: 1 }}
          />
        </View>
      }
    >
      <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, lineHeight: 23 }}>
        This cannot be undone. Your profile, transactions, budgets, shared expenses and cloud backups will be deleted. Export anything you want to keep first.
      </Text>
      <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md, marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
        Type DELETE to confirm
      </Text>
      <TextInput
        accessibilityLabel="Type DELETE to confirm account deletion"
        value={confirmation}
        onChangeText={setConfirmation}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!busy}
        placeholder="DELETE"
        placeholderTextColor={colors.textTertiary}
        style={{ backgroundColor: colors.card, borderColor: colors.border, borderRadius: BorderRadius.md, borderWidth: 1, color: colors.textPrimary, fontSize: Typography.fontSize.md, minHeight: 48, paddingHorizontal: Spacing.md }}
      />
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.emergency, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, lineHeight: 20, marginTop: Spacing.md }}>
          {error}
        </Text>
      ) : null}
      {!isBackendConfigured() ? (
        <Text style={{ color: colors.emergency, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, lineHeight: 20, marginTop: Spacing.md }}>
          In-app deletion is temporarily unavailable. You can still request deletion below.
        </Text>
      ) : null}
      <PressableScale
        accessibilityRole="link"
        accessibilityLabel="Request account deletion on the MoneyKai website"
        onPress={() => void Linking.openURL(`${SITE.url}/account-deletion`).catch(() => setError(`Could not open the website. Email ${SITE.supportEmail} to request deletion.`))}
        style={{ alignSelf: 'flex-start', marginTop: Spacing.lg, minHeight: 44, justifyContent: 'center' }}
      >
        <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, textDecorationLine: 'underline' }}>
          Can’t access your account? Request deletion online
        </Text>
      </PressableScale>
    </ModalSheet>
  );
}
