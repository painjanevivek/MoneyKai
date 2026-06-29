import 'dart:convert';

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

  test('persists and restores a large local transaction history', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalTransactionRepository(
      LocalStorageService(preferences),
    );

    final transactions = List.generate(1200, (index) {
      return MoneyTransaction(
        id: 'txn-$index',
        type: index.isEven ? TransactionType.expense : TransactionType.income,
        amount: 100 + index.toDouble(),
        date: DateTime(2023, 1, 1).add(Duration(days: index)),
        category: index.isEven ? 'Food' : 'Salary',
        paymentMethod: index.isEven ? 'UPI' : 'Bank transfer',
        description: 'History item $index',
      );
    });

    await repository.saveTransactions(transactions.reversed.toList());

    final restored = repository.readTransactions();
    expect(restored, hasLength(1200));
    expect(restored.first.id, 'txn-1199');
    expect(
      restored.first.date,
      DateTime(2023, 1, 1).add(const Duration(days: 1199)),
    );
    expect(restored.last.id, 'txn-0');
  });

  test('returns empty list for malformed stored transactions', () async {
    SharedPreferences.setMockInitialValues({'moneykai.transactions': '{bad'});
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalTransactionRepository(
      LocalStorageService(preferences),
    );

    expect(repository.readTransactions(), isEmpty);
  });

  test('skips malformed transaction entries', () async {
    SharedPreferences.setMockInitialValues({
      'moneykai.transactions':
          '[{"id":"bad"},{"id":"zero","type":"expense","amount":0,"date":"2026-06-01T00:00:00.000","category":"Food","paymentMethod":"UPI","description":"Bad amount"},{"id":"good","type":"expense","amount":250,"date":"2026-06-01T00:00:00.000","category":"Food","paymentMethod":"UPI","description":"Lunch"}]',
    });
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalTransactionRepository(
      LocalStorageService(preferences),
    );

    final restored = repository.readTransactions();
    expect(restored, hasLength(1));
    expect(restored.single.id, 'good');
  });

  test('skips stored transactions with blank required fields', () async {
    SharedPreferences.setMockInitialValues({
      'moneykai.transactions': jsonEncode([
        {
          'id': 'blank-category',
          'type': 'expense',
          'amount': 250,
          'date': '2026-06-01T00:00:00.000',
          'category': ' ',
          'paymentMethod': 'UPI',
          'description': 'Lunch',
        },
        {
          'id': ' good ',
          'type': 'expense',
          'amount': 250,
          'date': '2026-06-01T00:00:00.000',
          'category': ' Food ',
          'paymentMethod': ' UPI ',
          'description': ' Lunch ',
        },
      ]),
    });
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalTransactionRepository(
      LocalStorageService(preferences),
    );

    final restored = repository.readTransactions();

    expect(restored, hasLength(1));
    expect(restored.single.id, 'good');
    expect(restored.single.category, 'Food');
    expect(restored.single.paymentMethod, 'UPI');
    expect(restored.single.description, 'Lunch');
  });

  test('rejects non-finite transaction amounts before saving', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalTransactionRepository(
      LocalStorageService(preferences),
    );

    final transaction = MoneyTransaction(
      id: 'bad',
      type: TransactionType.expense,
      amount: double.infinity,
      date: DateTime(2026, 6, 1),
      category: 'Food',
      paymentMethod: 'UPI',
      description: 'Invalid amount',
    );

    expect(
      () => repository.saveTransactions([transaction]),
      throwsA(isA<FormatException>()),
    );
    expect(preferences.getString('moneykai.transactions'), isNull);
  });

  test('rejects blank required transaction fields before saving', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalTransactionRepository(
      LocalStorageService(preferences),
    );

    final transaction = MoneyTransaction(
      id: 'blank',
      type: TransactionType.expense,
      amount: 250,
      date: DateTime(2026, 6, 1),
      category: 'Food',
      paymentMethod: ' ',
      description: 'Lunch',
    );

    expect(
      () => repository.saveTransactions([transaction]),
      throwsA(isA<FormatException>()),
    );
    expect(preferences.getString('moneykai.transactions'), isNull);
  });
}
