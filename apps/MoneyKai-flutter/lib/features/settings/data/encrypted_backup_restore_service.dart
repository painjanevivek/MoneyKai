import 'dart:convert';

import 'package:flutter/material.dart';

import '../../../core/storage/local_storage_service.dart';
import '../../auth/data/local_auth_repository.dart';
import '../../auth/domain/local_user.dart';
import '../../budget/data/local_budget_repository.dart';
import '../../budget/domain/budget_state.dart';
import '../../transactions/data/local_transaction_repository.dart';
import '../../transactions/domain/money_transaction.dart';
import 'encrypted_backup_service.dart';
import 'local_data_export_service.dart';
import 'theme_preference_repository.dart';

class EncryptedBackupRestoreResult {
  const EncryptedBackupRestoreResult({
    required this.transactionCount,
    required this.displayName,
  });

  final int transactionCount;
  final String displayName;
}

class EncryptedBackupRestoreService {
  const EncryptedBackupRestoreService({
    required this.backupService,
    required this.storage,
    required this.authRepository,
    required this.transactionRepository,
    required this.budgetRepository,
    required this.themeRepository,
  });

  final EncryptedBackupService backupService;
  final LocalStorageService storage;
  final LocalAuthRepository authRepository;
  final LocalTransactionRepository transactionRepository;
  final LocalBudgetRepository budgetRepository;
  final ThemePreferenceRepository themeRepository;

  Future<EncryptedBackupRestoreResult> restoreEncryptedBackup({
    required String backupJson,
    required String password,
  }) async {
    final clearJson = await backupService.decryptBackup(
      backupJson: backupJson,
      password: password,
    );
    final decoded = jsonDecode(clearJson);
    if (decoded is! Map<String, Object?> ||
        decoded['formatVersion'] !=
            LocalDataExportService.exportFormatVersion ||
        decoded['source'] != 'moneykai-local-device') {
      throw const FormatException('Unsupported MoneyKai backup contents.');
    }

    final user = _readUser(decoded['user']);
    final transactions = _readTransactions(decoded['transactions']);
    final budget = _readBudget(decoded['budget']);
    final themeMode = _readThemeMode(decoded['settings']);

    await storage.resetNamespace();
    await authRepository.saveSession(
      email: user.email,
      displayName: user.displayName,
    );
    await transactionRepository.saveTransactions(transactions);
    await budgetRepository.saveBudget(budget);
    if (themeMode != null) {
      await themeRepository.saveThemeMode(themeMode);
    }

    return EncryptedBackupRestoreResult(
      transactionCount: transactions.length,
      displayName: user.displayName,
    );
  }

  LocalUser _readUser(Object? rawUser) {
    if (rawUser is! Map<String, Object?>) {
      throw const FormatException('Backup is missing a local user.');
    }

    try {
      return LocalUser.fromJson(rawUser);
    } catch (_) {
      throw const FormatException('Backup has an invalid local user.');
    }
  }

  List<MoneyTransaction> _readTransactions(Object? rawTransactions) {
    if (rawTransactions is! List<Object?>) {
      throw const FormatException('Backup has invalid transactions.');
    }

    try {
      final transactions = <MoneyTransaction>[];
      for (final item in rawTransactions) {
        if (item is! Map<String, Object?>) {
          throw const FormatException('Backup has invalid transactions.');
        }

        transactions.add(MoneyTransaction.fromJson(item));
      }
      return transactions;
    } catch (_) {
      throw const FormatException('Backup has invalid transactions.');
    }
  }

  BudgetState _readBudget(Object? rawBudget) {
    if (rawBudget is! Map<String, Object?>) {
      throw const FormatException('Backup has an invalid budget.');
    }

    if (rawBudget['monthlyLimit'] is! num ||
        rawBudget['categoryLimits'] is! Map) {
      throw const FormatException('Backup has an invalid budget.');
    }

    try {
      return BudgetState.fromJson(rawBudget);
    } catch (_) {
      throw const FormatException('Backup has an invalid budget.');
    }
  }

  ThemeMode? _readThemeMode(Object? rawSettings) {
    if (rawSettings == null) {
      return null;
    }

    if (rawSettings is! Map<String, Object?>) {
      throw const FormatException('Backup has invalid settings.');
    }

    final themeMode = rawSettings['themeMode'];
    return switch (themeMode) {
      null => null,
      'system' => ThemeMode.system,
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => throw const FormatException('Backup has invalid settings.'),
    };
  }
}
