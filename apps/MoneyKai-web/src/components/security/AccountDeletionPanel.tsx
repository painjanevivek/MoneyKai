import React, { useRef, useState } from 'react';
import { Pressable, Text, View, type PressableStateCallbackType } from 'react-native';
import { Link } from 'expo-router';
import { SectionCard } from '@/components/marketing/PublicShell';
import { Input } from '@/components/ui/Input';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { isBackendConfigured } from '@/services/backendApi';
import { deleteConfirmedAccount } from '@/services/accountDeletion';

export function AccountDeletionPanel() {
  const user = useAuthStore((s) => s.user);
  const authenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrating = useAuthStore((s) => s.isHydratingSession);
  const [completed, setCompleted] = useState<{ localSessionCleared: boolean } | null>(null);
  const { colors } = useTheme();
  const bodyStyle = { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, lineHeight: 22 };
  return (
    <SectionCard>
      <View style={{ gap: Spacing.md }}>
        <Text accessibilityRole="header" aria-level={2} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xl }}>
          {completed ? 'Account deleted' : 'Delete your account and data'}
        </Text>
        {completed ? (
          <Text role="status" aria-live="polite" style={bodyStyle}>
            MoneyKai verified deletion of the confirmed account and associated cloud data. {completed.localSessionCleared ? 'Your local session has been cleared.' : 'Your new sign-in session has been preserved.'} Remove exported files and copies on other devices separately.
          </Text>
        ) : hydrating ? (
          <Text role="status" aria-live="polite" style={bodyStyle}>Checking your sign-in… You can still read the instructions below.</Text>
        ) : authenticated && user ? (
          <SignedInDeletion key={user.id} ownerId={user.id} email={user.email} onComplete={setCompleted} />
        ) : (
          <>
            <Text style={bodyStyle}>Sign in to confirm ownership and permanently delete your MoneyKai account and stored data here. If you cannot sign in, use the email request below.</Text>
            <Link href="/login" asChild>
              <Pressable accessibilityRole="link" style={{ minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' }}>
                <Text style={{ ...bodyStyle, color: colors.textPrimary, textDecorationLine: 'underline', fontFamily: Typography.fontFamily.semiBold }}>Sign in to delete your account</Text>
              </Pressable>
            </Link>
          </>
        )}
      </View>
    </SectionCard>
  );
}

function SignedInDeletion({ ownerId, email, onComplete }: { ownerId: string; email?: string; onComplete: (result: { localSessionCleared: boolean }) => void }) {
  const { colors } = useTheme();
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const requestKey = useRef<string | null>(null);
  const configured = isBackendConfigured();
  const enabled = confirmation === 'DELETE' && configured && !busy;
  const bodyStyle = { color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, lineHeight: 22 };
  const handleDelete = async () => {
    if (!enabled || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    requestKey.current ??= globalThis.crypto?.randomUUID?.() ?? `account-deletion-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const result = await deleteConfirmedAccount(ownerId, confirmation, requestKey.current);
      onComplete(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Deletion could not be confirmed. Retry or contact support below.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: Spacing.md }}>
      <Text style={bodyStyle}>Signed in as {email || 'your current MoneyKai account'}.</Text>
      <Text style={bodyStyle}>This cannot be undone. Your profile, transactions, linked accounts, notes, budgets, groups, savings goals, notifications and cloud backups will be deleted.</Text>
      <Link href="/settings" asChild>
        <Pressable accessibilityRole="link" disabled={busy} style={{ minHeight: 48, justifyContent: 'center', alignSelf: 'flex-start' }}>
          <Text style={{ ...bodyStyle, color: colors.textPrimary, textDecorationLine: 'underline' }}>Keep my account / export data in Settings</Text>
        </Pressable>
      </Link>
      <Input label="Type DELETE to confirm" value={confirmation} onChangeText={setConfirmation} editable={!busy && configured} autoCapitalize="none" autoCorrect={false} autoComplete="off" maxLength={6} />
      {!configured ? <Text accessibilityRole="alert" style={bodyStyle}>Online deletion is unavailable. Use the support request below.</Text> : null}
      {error ? <Text accessibilityRole="alert" aria-live="assertive" style={{ ...bodyStyle, color: colors.error }}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !enabled, busy }}
        disabled={!enabled}
        onPress={() => void handleDelete()}
        style={({ focused }: PressableStateCallbackType & { focused?: boolean }) => ({ minHeight: 48, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: enabled ? colors.emergency : colors.surfaceElevated, borderWidth: 2, borderColor: focused ? colors.textPrimary : colors.border })}
      >
        <Text style={{ ...bodyStyle, textAlign: 'center', fontFamily: Typography.fontFamily.semiBold, color: enabled ? colors.textInverse : colors.textSecondary }}>
          {busy ? 'Deleting and verifying…' : 'Permanently delete my account'}
        </Text>
      </Pressable>
      <Text role="status" aria-live="polite" style={bodyStyle}>
        {busy ? 'Please wait for verification. Do not close this page.' : 'Your account is not deleted until you confirm and MoneyKai verifies completion.'}
      </Text>
    </View>
  );
}
