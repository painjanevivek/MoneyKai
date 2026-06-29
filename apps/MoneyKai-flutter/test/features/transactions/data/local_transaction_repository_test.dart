import 'package:flutter_test/flutter_test.dart';
import 'package:moneykai/core/storage/local_storage_service.dart';
import 'package:moneykai/features/transactions/data/local_transaction_repository.dart';
import 'package:moneykai/features/transactions/domain/money_transaction.dart';
import 'package:moneykai/features/transactions/domain/transaction_type.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('persists local transactions in newest-first order', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalTransactionRepository(
      LocalStorageService(preferences),
    );

    final older = MoneyTransaction(
      id: 'older',
      type: TransactionType.expense,
      amount: 250,
      date: DateTime(2026, 6, 1),
      category: 'Food',
      paymentMethod: 'UPI',
      description: 'Lunch',
    );
    final newer = MoneyTransaction(
      id: 'newer',
      type: TransactionType.income,
      amount: 24000,
      date: DateTime(2026, 6, 12),
      category: 'Salary',
      paymentMethod: 'Bank transfer',
      description: 'Salary deposit',
    );

    await repository.saveTransactions([older, newer]);

    final restored = repository.readTransactions();
    expect(restored.map((transaction) => transaction.id), ['newer', 'older']);
    expect(restored.first.amount, 24000);
  });
}
