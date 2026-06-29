import 'package:flutter_test/flutter_test.dart';
import 'package:moneykai/features/transactions/domain/money_transaction.dart';
import 'package:moneykai/features/transactions/domain/transaction_type.dart';

void main() {
  test('serializes a valid transaction', () {
    final transaction = MoneyTransaction(
      id: 'txn-1',
      type: TransactionType.expense,
      amount: 250,
      date: DateTime.utc(2026, 6, 29),
      category: 'Food',
      paymentMethod: 'UPI',
      description: 'Lunch',
    );

    expect(transaction.toJson(), {
      'id': 'txn-1',
      'type': 'expense',
      'amount': 250,
      'date': '2026-06-29T00:00:00.000Z',
      'category': 'Food',
      'paymentMethod': 'UPI',
      'description': 'Lunch',
    });
  });

  test('rejects invalid amounts during serialization', () {
    final transaction = MoneyTransaction(
      id: 'txn-1',
      type: TransactionType.expense,
      amount: double.nan,
      date: DateTime.utc(2026, 6, 29),
      category: 'Food',
      paymentMethod: 'UPI',
      description: 'Lunch',
    );

    expect(transaction.toJson, throwsA(isA<FormatException>()));
  });
}
