import 'dart:convert';

import 'package:cryptography/cryptography.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:moneykai/core/storage/local_storage_service.dart';
import 'package:moneykai/features/auth/data/local_auth_repository.dart';
import 'package:moneykai/features/budget/data/local_budget_repository.dart';
import 'package:moneykai/features/budget/domain/budget_state.dart';
import 'package:moneykai/features/settings/data/encrypted_backup_restore_service.dart';
import 'package:moneykai/features/settings/data/encrypted_backup_service.dart';
import 'package:moneykai/features/settings/data/local_data_export_service.dart';
import 'package:moneykai/features/settings/data/theme_preference_repository.dart';
import 'package:moneykai/features/transactions/data/local_transaction_repository.dart';
import 'package:moneykai/features/transactions/domain/money_transaction.dart';
import 'package:moneykai/features/transactions/domain/transaction_type.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test(
    'restores user, transactions, and budget from encrypted backup',
    () async {
      SharedPreferences.setMockInitialValues({'other.product.setting': 'keep'});
      final storage = LocalStorageService(
        await SharedPreferences.getInstance(),
      );
      final authRepository = LocalAuthRepository(storage);
      final transactionRepository = LocalTransactionRepository(storage);
      final budgetRepository = LocalBudgetRepository(storage);
      final themeRepository = ThemePreferenceRepository(storage);
      final backupService = EncryptedBackupService(
        exportService: LocalDataExportService(
          authRepository: authRepository,
          transactionRepository: transactionRepository,
          budgetRepository: budgetRepository,
          themeRepository: themeRepository,
          now: () => DateTime.utc(2026, 6, 29, 11),
        ),
        now: () => DateTime.utc(2026, 6, 29, 11),
        randomBytes: (length) =>
            List<int>.generate(length, (index) => index + 4),
      );

      await _seedOriginalData(
        authRepository,
        transactionRepository,
        budgetRepository,
        themeRepository,
      );
      final backup = await backupService.buildEncryptedBackup(
        password: 'correct horse battery staple',
      );
      await authRepository.saveSession(
        email: 'changed@example.com',
        displayName: 'Changed',
      );
      await transactionRepository.saveTransactions(const []);
      await budgetRepository.saveBudget(
        const BudgetState(monthlyLimit: 1, categoryLimits: {}),
      );
      await themeRepository.saveThemeMode(ThemeMode.light);

      final restoreService = EncryptedBackupRestoreService(
        backupService: backupService,
        storage: storage,
        authRepository: authRepository,
        transactionRepository: transactionRepository,
        budgetRepository: budgetRepository,
        themeRepository: themeRepository,
      );

      final result = await restoreService.restoreEncryptedBackup(
        backupJson: backup.content,
        password: 'correct horse battery staple',
      );

      expect(result.displayName, 'Akshay');
      expect(result.transactionCount, 1);
      expect(authRepository.readSession().user?.email, 'akshay@example.com');
      expect(
        transactionRepository.readTransactions().single.description,
        'Groceries',
      );
      expect(budgetRepository.readBudget().monthlyLimit, 30000);
      expect(themeRepository.readThemeMode(), ThemeMode.dark);
      expect(storage.readString('other.product.setting'), 'keep');
    },
  );

  test('restores older encrypted backups without settings', () async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final authRepository = LocalAuthRepository(storage);
    final transactionRepository = LocalTransactionRepository(storage);
    final budgetRepository = LocalBudgetRepository(storage);
    final themeRepository = ThemePreferenceRepository(storage);
    final backupService = EncryptedBackupService(
      exportService: _StaticExportService(
        authRepository: authRepository,
        transactionRepository: transactionRepository,
        budgetRepository: budgetRepository,
        themeRepository: themeRepository,
        hasValidUser: true,
      ),
      randomBytes: (length) => List<int>.filled(length, 7),
    );
    final backup = await backupService.buildEncryptedBackup(
      password: 'correct horse battery staple',
    );
    await themeRepository.saveThemeMode(ThemeMode.dark);

    final restoreService = EncryptedBackupRestoreService(
      backupService: backupService,
      storage: storage,
      authRepository: authRepository,
      transactionRepository: transactionRepository,
      budgetRepository: budgetRepository,
      themeRepository: themeRepository,
    );

    await restoreService.restoreEncryptedBackup(
      backupJson: backup.content,
      password: 'correct horse battery staple',
    );

    expect(themeRepository.readThemeMode(), ThemeMode.system);
  });

  test('fails restore with the wrong password', () async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final authRepository = LocalAuthRepository(storage);
    final transactionRepository = LocalTransactionRepository(storage);
    final budgetRepository = LocalBudgetRepository(storage);
    final themeRepository = ThemePreferenceRepository(storage);
    final backupService = EncryptedBackupService(
      exportService: LocalDataExportService(
        authRepository: authRepository,
        transactionRepository: transactionRepository,
        budgetRepository: budgetRepository,
        themeRepository: themeRepository,
      ),
      randomBytes: (length) => List<int>.filled(length, 9),
    );

    await _seedOriginalData(
      authRepository,
      transactionRepository,
      budgetRepository,
      themeRepository,
    );
    final backup = await backupService.buildEncryptedBackup(
      password: 'correct horse battery staple',
    );
    final restoreService = EncryptedBackupRestoreService(
      backupService: backupService,
      storage: storage,
      authRepository: authRepository,
      transactionRepository: transactionRepository,
      budgetRepository: budgetRepository,
      themeRepository: themeRepository,
    );

    expect(
      restoreService.restoreEncryptedBackup(
        backupJson: backup.content,
        password: 'wrong horse battery staple',
      ),
      throwsA(isA<SecretBoxAuthenticationError>()),
    );
  });

  test('rejects encrypted backup with malformed clear contents', () async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final authRepository = LocalAuthRepository(storage);
    final transactionRepository = LocalTransactionRepository(storage);
    final budgetRepository = LocalBudgetRepository(storage);
    final themeRepository = ThemePreferenceRepository(storage);
    final backupService = EncryptedBackupService(
      exportService: _StaticExportService(
        authRepository: authRepository,
        transactionRepository: transactionRepository,
        budgetRepository: budgetRepository,
        themeRepository: themeRepository,
      ),
      randomBytes: (length) => List<int>.filled(length, 3),
    );
    final backup = await backupService.buildEncryptedBackup(
      password: 'correct horse battery staple',
    );
    final restoreService = EncryptedBackupRestoreService(
      backupService: backupService,
      storage: storage,
      authRepository: authRepository,
      transactionRepository: transactionRepository,
      budgetRepository: budgetRepository,
      themeRepository: themeRepository,
    );

    expect(
      restoreService.restoreEncryptedBackup(
        backupJson: backup.content,
        password: 'correct horse battery staple',
      ),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects invalid backup user without clearing local data', () async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final authRepository = LocalAuthRepository(storage);
    final transactionRepository = LocalTransactionRepository(storage);
    final budgetRepository = LocalBudgetRepository(storage);
    final themeRepository = ThemePreferenceRepository(storage);
    final backupService = EncryptedBackupService(
      exportService: _StaticExportService(
        authRepository: authRepository,
        transactionRepository: transactionRepository,
        budgetRepository: budgetRepository,
        themeRepository: themeRepository,
        user: {'email': '@', 'displayName': 'Bad User'},
      ),
      randomBytes: (length) => List<int>.filled(length, 4),
    );
    final backup = await backupService.buildEncryptedBackup(
      password: 'correct horse battery staple',
    );
    await _seedOriginalData(
      authRepository,
      transactionRepository,
      budgetRepository,
      themeRepository,
    );
    final restoreService = EncryptedBackupRestoreService(
      backupService: backupService,
      storage: storage,
      authRepository: authRepository,
      transactionRepository: transactionRepository,
      budgetRepository: budgetRepository,
      themeRepository: themeRepository,
    );

    expect(
      restoreService.restoreEncryptedBackup(
        backupJson: backup.content,
        password: 'correct horse battery staple',
      ),
      throwsA(isA<FormatException>()),
    );
    expect(authRepository.readSession().user?.email, 'akshay@example.com');
    expect(transactionRepository.readTransactions(), hasLength(1));
    expect(budgetRepository.readBudget().monthlyLimit, 30000);
    expect(themeRepository.readThemeMode(), ThemeMode.dark);
  });

  test(
    'rejects backup user email whitespace without clearing local data',
    () async {
      SharedPreferences.setMockInitialValues({});
      final storage = LocalStorageService(
        await SharedPreferences.getInstance(),
      );
      final authRepository = LocalAuthRepository(storage);
      final transactionRepository = LocalTransactionRepository(storage);
      final budgetRepository = LocalBudgetRepository(storage);
      final themeRepository = ThemePreferenceRepository(storage);
      final backupService = EncryptedBackupService(
        exportService: _StaticExportService(
          authRepository: authRepository,
          transactionRepository: transactionRepository,
          budgetRepository: budgetRepository,
          themeRepository: themeRepository,
          user: {'email': 'akshay@ example.com', 'displayName': 'Bad User'},
        ),
        randomBytes: (length) => List<int>.filled(length, 12),
      );
      final backup = await backupService.buildEncryptedBackup(
        password: 'correct horse battery staple',
      );
      await _seedOriginalData(
        authRepository,
        transactionRepository,
        budgetRepository,
        themeRepository,
      );
      final restoreService = EncryptedBackupRestoreService(
        backupService: backupService,
        storage: storage,
        authRepository: authRepository,
        transactionRepository: transactionRepository,
        budgetRepository: budgetRepository,
        themeRepository: themeRepository,
      );

      expect(
        restoreService.restoreEncryptedBackup(
          backupJson: backup.content,
          password: 'correct horse battery staple',
        ),
        throwsA(isA<FormatException>()),
      );
      expect(authRepository.readSession().user?.email, 'akshay@example.com');
      expect(transactionRepository.readTransactions(), hasLength(1));
      expect(budgetRepository.readBudget().monthlyLimit, 30000);
      expect(themeRepository.readThemeMode(), ThemeMode.dark);
    },
  );

  test('rejects encrypted backup with malformed transactions', () async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final authRepository = LocalAuthRepository(storage);
    final transactionRepository = LocalTransactionRepository(storage);
    final budgetRepository = LocalBudgetRepository(storage);
    final themeRepository = ThemePreferenceRepository(storage);
    final backupService = EncryptedBackupService(
      exportService: _StaticExportService(
        authRepository: authRepository,
        transactionRepository: transactionRepository,
        budgetRepository: budgetRepository,
        themeRepository: themeRepository,
        hasValidUser: true,
        transactions: ['bad-transaction'],
      ),
      randomBytes: (length) => List<int>.filled(length, 5),
    );
    final backup = await backupService.buildEncryptedBackup(
      password: 'correct horse battery staple',
    );
    final restoreService = EncryptedBackupRestoreService(
      backupService: backupService,
      storage: storage,
      authRepository: authRepository,
      transactionRepository: transactionRepository,
      budgetRepository: budgetRepository,
      themeRepository: themeRepository,
    );

    expect(
      restoreService.restoreEncryptedBackup(
        backupJson: backup.content,
        password: 'correct horse battery staple',
      ),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects encrypted backup with invalid transaction amounts', () async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final authRepository = LocalAuthRepository(storage);
    final transactionRepository = LocalTransactionRepository(storage);
    final budgetRepository = LocalBudgetRepository(storage);
    final themeRepository = ThemePreferenceRepository(storage);
    final backupService = EncryptedBackupService(
      exportService: _StaticExportService(
        authRepository: authRepository,
        transactionRepository: transactionRepository,
        budgetRepository: budgetRepository,
        themeRepository: themeRepository,
        hasValidUser: true,
        transactions: [
          {
            'id': 'bad',
            'type': 'expense',
            'amount': 0,
            'date': '2026-06-01T00:00:00.000',
            'category': 'Food',
            'paymentMethod': 'UPI',
            'description': 'Bad amount',
          },
        ],
      ),
      randomBytes: (length) => List<int>.filled(length, 8),
    );
    final backup = await backupService.buildEncryptedBackup(
      password: 'correct horse battery staple',
    );
    final restoreService = EncryptedBackupRestoreService(
      backupService: backupService,
      storage: storage,
      authRepository: authRepository,
      transactionRepository: transactionRepository,
      budgetRepository: budgetRepository,
      themeRepository: themeRepository,
    );

    expect(
      restoreService.restoreEncryptedBackup(
        backupJson: backup.content,
        password: 'correct horse battery staple',
      ),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects encrypted backup with invalid budget limits', () async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final authRepository = LocalAuthRepository(storage);
    final transactionRepository = LocalTransactionRepository(storage);
    final budgetRepository = LocalBudgetRepository(storage);
    final themeRepository = ThemePreferenceRepository(storage);
    final backupService = EncryptedBackupService(
      exportService: _StaticExportService(
        authRepository: authRepository,
        transactionRepository: transactionRepository,
        budgetRepository: budgetRepository,
        themeRepository: themeRepository,
        hasValidUser: true,
        budget: {
          'monthlyLimit': 30000,
          'categoryLimits': {'Food': -1},
        },
      ),
      randomBytes: (length) => List<int>.filled(length, 10),
    );
    final backup = await backupService.buildEncryptedBackup(
      password: 'correct horse battery staple',
    );
    final restoreService = EncryptedBackupRestoreService(
      backupService: backupService,
      storage: storage,
      authRepository: authRepository,
      transactionRepository: transactionRepository,
      budgetRepository: budgetRepository,
      themeRepository: themeRepository,
    );

    expect(
      restoreService.restoreEncryptedBackup(
        backupJson: backup.content,
        password: 'correct horse battery staple',
      ),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects encrypted backup with malformed settings', () async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final authRepository = LocalAuthRepository(storage);
    final transactionRepository = LocalTransactionRepository(storage);
    final budgetRepository = LocalBudgetRepository(storage);
    final themeRepository = ThemePreferenceRepository(storage);
    final backupService = EncryptedBackupService(
      exportService: _StaticExportService(
        authRepository: authRepository,
        transactionRepository: transactionRepository,
        budgetRepository: budgetRepository,
        themeRepository: themeRepository,
        hasValidUser: true,
        settings: {'themeMode': 'blue'},
      ),
      randomBytes: (length) => List<int>.filled(length, 6),
    );
    final backup = await backupService.buildEncryptedBackup(
      password: 'correct horse battery staple',
    );
    final restoreService = EncryptedBackupRestoreService(
      backupService: backupService,
      storage: storage,
      authRepository: authRepository,
      transactionRepository: transactionRepository,
      budgetRepository: budgetRepository,
      themeRepository: themeRepository,
    );

    expect(
      restoreService.restoreEncryptedBackup(
        backupJson: backup.content,
        password: 'correct horse battery staple',
      ),
      throwsA(isA<FormatException>()),
    );
  });
}

Future<void> _seedOriginalData(
  LocalAuthRepository authRepository,
  LocalTransactionRepository transactionRepository,
  LocalBudgetRepository budgetRepository,
  ThemePreferenceRepository themeRepository,
) async {
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
}

class _StaticExportService extends LocalDataExportService {
  _StaticExportService({
    required super.authRepository,
    required super.transactionRepository,
    required super.budgetRepository,
    required super.themeRepository,
    this.hasValidUser = false,
    this.user,
    this.transactions = const [],
    this.budget = const {'monthlyLimit': 30000, 'categoryLimits': {}},
    this.settings,
  });

  final bool hasValidUser;
  final Object? user;
  final List<Object?> transactions;
  final Object? budget;
  final Object? settings;

  @override
  String buildExportJson() {
    return jsonEncode({
      'formatVersion': LocalDataExportService.exportFormatVersion,
      'source': 'moneykai-local-device',
      'user':
          user ??
          (hasValidUser
              ? {'email': 'akshay@example.com', 'displayName': 'Akshay'}
              : {'email': 'akshay@example.com'}),
      'transactions': transactions,
      'budget': budget,
      if (settings != null) 'settings': settings,
    });
  }
}
