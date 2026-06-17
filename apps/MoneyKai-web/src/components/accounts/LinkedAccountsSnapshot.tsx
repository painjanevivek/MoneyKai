import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  formatLinkedAccountMask,
  summarizeLinkedAccounts,
} from '@moneykai/domain';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLinkedAccountStore } from '@/stores/useLinkedAccountStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/utils/formatCurrency';

export function LinkedAccountsSnapshot() {
  const { colors } = useTheme();
  const userId = useAuthStore((s) => s.user?.id ?? 'local');
  const accounts = useLinkedAccountStore((s) => s.accounts);
  const connectSandboxAccounts = useLinkedAccountStore((s) => s.connectSandboxAccounts);
  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.status !== 'disconnected'),
    [accounts]
  );
  const summary = useMemo(() => summarizeLinkedAccounts(accounts), [accounts]);

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md, marginBottom: Spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Linked Accounts
          </Text>
          <Text style={{ marginTop: 4, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
            Real balances and imported transactions feeding this workspace.
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/accounts' as any)} accessibilityRole="button" accessibilityLabel="Open linked accounts">
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {activeAccounts.length === 0 ? (
        <View style={{ gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg }}>
            <MaterialCommunityIcons name="bank-plus" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                No accounts connected
              </Text>
              <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
                Connect sandbox accounts to import account-tagged transactions.
              </Text>
            </View>
          </View>
          <Button title="Connect Sandbox Bank" icon="bank-plus" onPress={() => connectSandboxAccounts(userId)} variant="outline" />
        </View>
      ) : (
        <View style={{ gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            <View style={{ flex: 1, minWidth: 130, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.primaryBg }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Cash balance</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 2, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
                {formatCurrency(summary.cashBalance)}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 130, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>Accounts</Text>
              <Text style={{ marginTop: 2, fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
                {summary.connectedAccounts}/{summary.totalAccounts}
              </Text>
            </View>
          </View>
          <View style={{ gap: Spacing.sm }}>
            {activeAccounts.slice(0, 3).map((account) => (
              <TouchableOpacity
                key={account.id}
                onPress={() => router.push('/accounts' as any)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}
              >
                <View style={{ width: 34, height: 34, borderRadius: BorderRadius.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name={account.kind === 'credit_card' ? 'credit-card-outline' : 'bank-outline'} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                    {account.displayName}
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                    {formatLinkedAccountMask(account)}
                  </Text>
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ maxWidth: 116, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
                  {formatCurrency(account.balance.current)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

export default LinkedAccountsSnapshot;
