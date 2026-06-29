import 'dart:convert';

import 'package:cryptography/cryptography.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:moneykai/core/storage/local_storage_service.dart';
import 'package:moneykai/features/auth/data/local_auth_repository.dart';
import 'package:moneykai/features/budget/data/local_budget_repository.dart';
import 'package:moneykai/features/budget/domain/budget_state.dart';
import 'package:moneykai/features/settings/data/encrypted_backup_service.dart';
import 'package:moneykai/features/settings/data/local_data_export_service.dart';
import 'package:moneykai/features/settings/data/theme_preference_repository.dart';
import 'package:moneykai/features/transactions/data/local_transaction_repository.dart';
import 'package:moneykai/features/transactions/domain/money_transaction.dart';
import 'package:moneykai/features/transactions/domain/transaction_type.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('creates a decryptable encrypted backup file payload', () async {
    final exportService = await _seedExportService();
    final backupService = EncryptedBackupService(
      exportService: exportService,
      now: () => DateTime.utc(2026, 6, 29, 10, 15),
      randomBytes: (length) => List<int>.generate(length, (index) => index + 1),
    );

    final backup = await backupService.buildEncryptedBackup(
      password: 'correct horse battery staple',
    );

    expect(backup.fileName, 'moneykai-encrypted-backup-20260629T101500Z.json');
    expect(backup.content, isNot(contains('Groceries')));

    final decoded = jsonDecode(backup.content) as Map<String, Object?>;
    expect(
      decoded['formatVersion'],
      EncryptedBackupService.backupFormatVersion,
    );
    expect(decoded['kind'], 'moneykai-encrypted-backup');
    expect(decoded['payload'], isA<String>());

    final clearJson = await backupService.decryptBackup(
      backupJson: backup.content,
      password: 'correct horse battery staple',
    );
    final clearPayload = jsonDecode(clearJson) as Map<String, Object?>;

    expect(clearPayload['source'], 'moneykai-local-device');
    final transactions = clearPayload['transactions'] as List<Object?>;
    expect(transactions.first, containsPair('description', 'Groceries'));
    final settings = clearPayload['settings'] as Map<String, Object?>;
    expect(settings['themeMode'], 'dark');
  });

  test('rejects short backup passwords', () async {
    final exportService = await _seedExportService();
    final backupService = EncryptedBackupService(exportService: exportService);

    expect(
      backupService.buildEncryptedBackup(password: 'short'),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects encrypted backup without a local profile', () async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final exportService = LocalDataExportService(
      authRepository: LocalAuthRepository(storage),
      transactionRepository: LocalTransactionRepository(storage),
      budgetRepository: LocalBudgetRepository(storage),
      themeRepository: ThemePreferenceRepository(storage),
    );
    final backupService = EncryptedBackupService(exportService: exportService);

    expect(
      backupService.buildEncryptedBackup(
        password: 'correct horse battery staple',
      ),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects malformed encrypted backup metadata', () async {
    final exportService = await _seedExportService();
    final backupService = EncryptedBackupService(exportService: exportService);

    expect(
      backupService.decryptBackup(
        backupJson: jsonEncode({
          'kind': 'moneykai-encrypted-backup',
          'encryption': {'salt': 'bad'},
          'payload': 'bad',
        }),
        password: 'correct horse battery staple',
      ),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects encrypted backup with invalid base64 payload', () async {
    final exportService = await _seedExportService();
    final backupService = EncryptedBackupService(
      exportService: exportService,
      now: () => DateTime.utc(2026, 6, 29, 10, 15),
      randomBytes: (length) => List<int>.filled(length, 8),
    );
    final backup = await backupService.buildEncryptedBackup(
      password: 'correct horse battery staple',
    );
    final decoded = jsonDecode(backup.content) as Map<String, Object?>;
    decoded['payload'] = '#not-base64';

    expect(
      backupService.decryptBackup(
        backupJson: jsonEncode(decoded),
        password: 'correct horse battery staple',
      ),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects encrypted backup with unsupported metadata', () async {
    final exportService = await _seedExportService();
    final backupService = EncryptedBackupService(
      exportService: exportService,
      now: () => DateTime.utc(2026, 6, 29, 10, 15),
      randomBytes: (length) => List<int>.filled(length, 9),
    );
    final backup = await backupService.buildEncryptedBackup(
      password: 'correct horse battery staple',
    );
    final decoded = jsonDecode(backup.content) as Map<String, Object?>;
    final encryption = decoded['encryption'] as Map<String, Object?>;
    encryption['algorithm'] = 'AES-128-GCM';

    expect(
      backupService.decryptBackup(
        backupJson: jsonEncode(decoded),
        password: 'correct horse battery staple',
      ),
      throwsA(isA<FormatException>()),
    );
  });

  test(
    'rejects encrypted backup with invalid encryption field lengths',
    () async {
      final exportService = await _seedExportService();
      final backupService = EncryptedBackupService(
        exportService: exportService,
        now: () => DateTime.utc(2026, 6, 29, 10, 15),
        randomBytes: (length) => List<int>.filled(length, 10),
      );
      final backup = await backupService.buildEncryptedBackup(
        password: 'correct horse battery staple',
      );
      final decoded = jsonDecode(backup.content) as Map<String, Object?>;
      final encryption = decoded['encryption'] as Map<String, Object?>;
      encryption['nonce'] = base64Encode([1, 2, 3]);

      expect(
        backupService.decryptBackup(
          backupJson: jsonEncode(decoded),
          password: 'correct horse battery staple',
        ),
        throwsA(isA<FormatException>()),
      );
    },
  );

  test('rejects encrypted backup with empty encrypted payload', () async {
    final exportService = await _seedExportService();
    final backupService = EncryptedBackupService(
      exportService: exportService,
      now: () => DateTime.utc(2026, 6, 29, 10, 15),
      randomBytes: (length) => List<int>.filled(length, 11),
    );
    final backup = await backupService.buildEncryptedBackup(
      password: 'correct horse battery staple',
    );
    final decoded = jsonDecode(backup.content) as Map<String, Object?>;
    decoded['payload'] = '';

    expect(
      backupService.decryptBackup(
        backupJson: jsonEncode(decoded),
        password: 'correct horse battery staple',
      ),
      throwsA(isA<FormatException>()),
    );
  });

  test('fails to decrypt with the wrong password', () async {
    final exportService = await _seedExportService();
    final backupService = EncryptedBackupService(
      exportService: exportService,
      now: () => DateTime.utc(2026, 6, 29, 10, 15),
      randomBytes: (length) => List<int>.filled(length, 7),
    );

    final backup = await backupService.buildEncryptedBackup(
      password: 'correct horse battery staple',
    );

    expect(
      backupService.decryptBackup(
        backupJson: backup.content,
        password: 'wrong horse battery staple',
      ),
      throwsA(isA<SecretBoxAuthenticationError>()),
    );
  });
}

Future<LocalDataExportService> _seedExportService() async {
  SharedPreferences.setMockInitialValues({});
  final storage = LocalStorageService(await SharedPreferences.getInstance());
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

  return LocalDataExportService(
    authRepository: authRepository,
    transactionRepository: transactionRepository,
    budgetRepository: budgetRepository,
    themeRepository: themeRepository,
    now: () => DateTime.utc(2026, 6, 29, 10, 15),
  );
}
