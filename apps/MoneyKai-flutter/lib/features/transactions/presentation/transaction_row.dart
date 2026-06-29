import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../core/formatters/money_formatter.dart';
import '../domain/money_transaction.dart';
import '../domain/transaction_type.dart';

class TransactionRow extends StatelessWidget {
  TransactionRow({
    required this.transaction,
    required this.onDelete,
    super.key,
  });

  final MoneyTransaction transaction;
  final VoidCallback onDelete;

  final MoneyFormatter _money = MoneyFormatter();
  final DateFormat _date = DateFormat('dd MMM yyyy');

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final signedAmount = transaction.type == TransactionType.income
        ? '+${_money.format(transaction.amount)}'
        : '-${_money.format(transaction.amount)}';

    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: colorScheme.primaryContainer,
          foregroundColor: colorScheme.onPrimaryContainer,
          child: Icon(
            transaction.type == TransactionType.income
                ? Icons.arrow_downward
                : Icons.arrow_upward,
          ),
        ),
        title: Text(transaction.description),
        subtitle: Text(
          '${transaction.category} - ${transaction.paymentMethod} - ${_date.format(transaction.date)}',
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              signedAmount,
              style: TextStyle(
                color: transaction.type == TransactionType.income
                    ? colorScheme.primary
                    : colorScheme.error,
                fontWeight: FontWeight.w700,
              ),
            ),
            IconButton(
              tooltip: 'Delete transaction',
              onPressed: onDelete,
              icon: const Icon(Icons.delete_outline),
            ),
          ],
        ),
      ),
    );
  }
}
