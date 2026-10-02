import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppIcon as MaterialCommunityIcons } from '@/components/ui/AppIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { BorderRadius, Spacing, TransactionDirectionColor, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Group, GroupExpense } from '@/types/group';
import { deriveSharedPosition, formatPaise } from '@/utils/groupExpense';

const GROUP_ICONS: Record<Group['type'], string> = {
  trip: 'airplane',
  flatmates: 'home-outline',
  friends: 'account-multiple-outline',
  event: 'calendar-star',
};

interface GroupSummaryCardProps {
  group: Group;
  expenses: GroupExpense[];
  currentUserId: string;
  currencySymbol: string;
  onAddExpense: () => void;
  onOpenLedger: () => void;
}

export function GroupSummaryCard({ group, expenses, currentUserId, currencySymbol, onOpenLedger }: GroupSummaryCardProps) {
  const { colors } = useTheme();
  const position = useMemo(() => deriveSharedPosition(expenses, currentUserId), [currentUserId, expenses]);
  const pendingCount = expenses.filter((expense) => expense.sync_status === 'pending' || expense.sync_status === 'failed').length;
  const memberCount = Math.max(group.members?.length ?? 0, 1);
  const confirmedCount = expenses.length - pendingCount;
  const balanceLabel = position.owedPaise > 0 && position.owePaise > 0
    ? `You're owed ${formatPaise(position.owedPaise, currencySymbol)} and you owe ${formatPaise(position.owePaise, currencySymbol)}`
    : position.owedPaise > 0 ? `You're owed ${formatPaise(position.owedPaise, currencySymbol)}`
    : position.owePaise > 0 ? `You owe ${formatPaise(position.owePaise, currencySymbol)}`
    : confirmedCount > 0 ? 'All settled' : 'No expenses yet';

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Open ${group.name}. ${memberCount} people. ${balanceLabel}`}
      onPress={onOpenLedger}
      style={{ backgroundColor: colors.card, borderColor: colors.borderLight, borderRadius: BorderRadius.md, borderWidth: 1, minHeight: 98, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md }}
    >
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: Spacing.md }}>
        <View style={{ alignItems: 'center', backgroundColor: colors.primaryBg, borderRadius: BorderRadius.full, height: 38, justifyContent: 'center', width: 38 }}>
          <MaterialCommunityIcons name={GROUP_ICONS[group.type]} color={colors.primaryDark} size={19} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.lg }}>{group.name}</Text>
          <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: 2 }}>
            {memberCount} {memberCount === 1 ? 'person' : 'people'} · {confirmedCount} {confirmedCount === 1 ? 'expense' : 'expenses'}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" color={colors.textTertiary} size={20} />
      </View>
      <Text numberOfLines={2} style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, marginLeft: 38 + Spacing.md, marginTop: Spacing.sm }}>
        {position.owedPaise > 0 ? <Text style={{ color: TransactionDirectionColor.credit }}>You are owed {formatPaise(position.owedPaise, currencySymbol)}</Text> : null}
        {position.owedPaise > 0 && position.owePaise > 0 ? ' · ' : null}
        {position.owePaise > 0 ? <Text style={{ color: TransactionDirectionColor.debit }}>You owe {formatPaise(position.owePaise, currencySymbol)}</Text> : null}
        {!position.owedPaise && !position.owePaise ? balanceLabel : null}
      </Text>
      {pendingCount > 0 ? <Text accessibilityRole="alert" style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, marginLeft: 38 + Spacing.md, marginTop: 3 }}>{pendingCount} awaiting confirmation</Text> : null}
    </PressableScale>
  );
}
