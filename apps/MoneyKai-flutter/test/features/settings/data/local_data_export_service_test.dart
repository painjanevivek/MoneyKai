import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:moneykai/core/storage/local_storage_service.dart';
import 'package:moneykai/features/auth/data/local_auth_repository.dart';
import 'package:moneykai/features/budget/data/local_budget_repository.dart';
import 'package:moneykai/features/budget/domain/budget_state.dart';
import 'package:moneykai/features/settings/data/local_data_export_service.dart';
import 'package:moneykai/features/settings/data/theme_preference_repository.dart';
import 'package:moneykai/features/transactions/data/local_transaction_repository.dart';
import 'package:moneykai/features/transactions/domain/money_transaction.dart';
import 'package:moneykai/features/transactions/domain/transaction_type.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('exports local user, transactions, and budget as JSON', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final storage = LocalStorageService(preferences);
    final authRepository = LocalAuthRepository(storage);
    final transactionRepository = LocalTransactionRepository(storage);
    final budgetRepository = LocalBudgetRepository(storage);
    final themeRepository = ThemePreferenceRepository(storage);

    await authRepository.saveSession(
      email: 'akshay@example.com',
      displayName: 'Akshay',
    );
    await transactionRepository.saveTransactions([
      MoneyTransaction(
        id: 'txn-1',
        type: TransactionType.expense,
        amount: 899,
        date: DateTime.utc(2026, 6, 29),
        category: 'Food',
        paymentMethod: 'UPI',
        description: 'Groceries',
      ),
    ]);
    await budgetRepository.saveBudget(
      const BudgetState(monthlyLimit: 30000, categoryLimits: {'Food': 9000}),
    );
    await themeRepository.saveThemeMode(ThemeMode.dark);

    final exportService = LocalDataExportService(
      authRepository: authRepository,
      transactionRepository: transactionRepository,
      budgetRepository: budgetRepository,
      themeRepository: themeRepository,
      now: () => DateTime.utc(2026, 6, 29, 8, 30),
    );

    final decoded =
        jsonDecode(exportService.buildExportJson()) as Map<String, Object?>;

    expect(
      decoded['formatVersion'],
      LocalDataExportService.exportFormatVersion,
    );
    expect(decoded['exportedAt'], '2026-06-29T08:30:00.000Z');
    expect(decoded['source'], 'moneykai-local-device');
    expect(decoded['user'], {
      'email': 'akshay@example.com',
      'displayName': 'Akshay',
    });

    final transactions = decoded['transactions'] as List<Object?>;
    expect(transactions, hasLength(1));
    expect(transactions.first, containsPair('description', 'Groceries'));
    expect(transactions.first, containsPair('amount', 899));

    final budget = decoded['budget'] as Map<String, Object?>;
    expect(budget['monthlyLimit'], 30000);
    expect(budget['categoryLimits'], {'Food': 9000.0});

    final settings = decoded['settings'] as Map<String, Object?>;
    expect(settings['themeMode'], 'dark');
  });

  test('rejects export without a local profile', () async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final exportService = LocalDataExportService(
      authRepository: LocalAuthRepository(storage),
      transactionRepository: LocalTransactionRepository(storage),
      budgetRepository: LocalBudgetRepository(storage),
      themeRepository: ThemePreferenceRepository(storage),
    );

    expect(exportService.buildExportJson, throwsA(isA<FormatException>()));
  });
}
