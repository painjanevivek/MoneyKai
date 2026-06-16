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
    <Card style={{ borderRadius: BorderRadius.xl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: Typography.fontSize.md,
              fontFamily: Typography.fontFamily.semiBold,
              color: colors.textPrimary,
            }}
          >
            Recent ledger
          </Text>
          <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
            Latest reviewed money movement
          </Text>
        </View>
        <TouchableOpacity accessibilityRole="button" onPress={onViewAll} style={{ paddingVertical: 6, paddingLeft: Spacing.sm }}>
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontFamily: Typography.fontFamily.medium,
              color: colors.primary,
            }}
          >
            View all
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
                paddingVertical: 11,
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: colors.borderLight,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: BorderRadius.md,
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
              <View style={{ flex: 1, paddingRight: Spacing.sm }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: colors.textPrimary,
                  }}
                >
                  {txn.description || category?.name || 'Transaction'}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: Typography.fontSize.xs,
                    fontFamily: Typography.fontFamily.regular,
                    color: colors.textTertiary,
                  }}
                >
                  {category?.name || 'Uncategorized'} - {formatRelativeDate(txn.transaction_date)}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.74}
                style={{
                  fontSize: Typography.fontSize.base,
                  fontFamily: Typography.fontFamily.semiBold,
                  color: isExpense ? colors.emergency : colors.primaryLight,
                  maxWidth: 116,
                  textAlign: 'right',
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
            No reviewed transactions yet. Add one to start filling out this ledger.
          </Text>
        </View>
      )}
    </Card>
  );
};

export default RecentTransactions;
