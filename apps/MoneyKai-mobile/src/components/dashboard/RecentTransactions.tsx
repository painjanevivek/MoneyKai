import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRelativeDate } from '../../utils/dateUtils';
import { getCategoryById } from '../../constants/categories';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import type { Transaction } from '../../types/transaction';

export const RecentTransactions: React.FC<{ onViewAll?: () => void; transactions?: Transaction[] }> = ({
  onViewAll,
  transactions,
}) => {
  const { colors } = useTheme();
  const storeRecentTxns = useTransactionStore((s) => s.getRecentTransactions(5));
  const recentTxns = transactions ?? storeRecentTxns;

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text
          style={{
            fontSize: Typography.fontSize.md,
            fontFamily: Typography.fontFamily.semiBold,
            color: colors.textPrimary,
          }}
        >
          Recent Transactions
        </Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontFamily: Typography.fontFamily.medium,
              color: colors.primary,
            }}
          >
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {recentTxns.length > 0 ? (
        recentTxns.map((txn, index) => {
          const category = getCategoryById(txn.category);
          const isExpense = txn.type === 'expense';

          return (
            <View
              key={txn.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: Spacing.sm,
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: colors.borderLight,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: BorderRadius.sm,
                  backgroundColor: category?.colorLight || '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: Spacing.md,
                }}
              >
                <MaterialCommunityIcons
                  name={(category?.icon || 'help-circle-outline') as any}
                  size={20}
                  color={category?.color || '#6B7280'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontFamily: Typography.fontFamily.medium,
                    color: colors.textPrimary,
                  }}
                >
                  {txn.description}
                </Text>
                <Text
                  style={{
                    fontSize: Typography.fontSize.xs,
                    fontFamily: Typography.fontFamily.regular,
                    color: colors.textTertiary,
                  }}
                >
                  {category?.name} • {formatRelativeDate(txn.transaction_date)}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: Typography.fontSize.base,
                  fontFamily: Typography.fontFamily.semiBold,
                  color: isExpense ? colors.emergency : colors.primaryLight,
                }}
              >
                {isExpense ? '-' : '+'}
                {formatCurrency(txn.amount)}
              </Text>
            </View>
          );
        })
      ) : (
        <View
          style={{
            paddingVertical: Spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.borderLight,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textSecondary,
              lineHeight: 20,
            }}
          >
            No recent transactions yet. Add one to start filling out this dashboard.
          </Text>
        </View>
      )}
    </Card>
  );
};

export default RecentTransactions;
