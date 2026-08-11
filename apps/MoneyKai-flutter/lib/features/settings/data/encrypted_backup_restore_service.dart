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

  static const maxTransactionCount = 10000;
  static const maxBudgetCategoryCount = 256;
  static const maxEmailBytes = 254;
  static const maxDisplayNameBytes = 128;
  static const maxTransactionIdBytes = 128;
  static const maxTransactionTypeBytes = 16;
  static const maxTransactionDateBytes = 64;
  static const maxTransactionCategoryBytes = 128;
  static const maxPaymentMethodBytes = 128;
  static const maxTransactionDescriptionBytes = 2048;
  static const maxBudgetCategoryNameBytes = 128;

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

    final stagedStorage = storage.createStagingNamespace();
    final stagedAuthRepository = LocalAuthRepository(stagedStorage);
    final stagedTransactionRepository = LocalTransactionRepository(
      stagedStorage,
    );
    final stagedBudgetRepository = LocalBudgetRepository(stagedStorage);
    final stagedThemeRepository = ThemePreferenceRepository(stagedStorage);

    try {
      await stagedAuthRepository.saveSession(
        email: user.email,
        displayName: user.displayName,
      );
      await stagedTransactionRepository.saveTransactions(transactions);
      await stagedBudgetRepository.saveBudget(budget);
      if (themeMode != null) {
        await stagedThemeRepository.saveThemeMode(themeMode);
      }

      _verifyStagedRestore(
        authRepository: stagedAuthRepository,
        transactionRepository: stagedTransactionRepository,
        budgetRepository: stagedBudgetRepository,
        themeRepository: stagedThemeRepository,
        user: user,
        transactions: transactions,
        budget: budget,
        themeMode: themeMode ?? ThemeMode.system,
      );
      await storage.activateStagedNamespace(stagedStorage);
    } catch (_) {
      try {
        await storage.discardStagedNamespace(stagedStorage);
      } catch (_) {
        // If activation already completed, the committed namespace must remain.
      }
      rethrow;
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

    _requireBoundedText(
      rawUser['email'],
      maxBytes: maxEmailBytes,
      fieldName: 'Local user email',
    );
    _requireBoundedText(
      rawUser['displayName'],
      maxBytes: maxDisplayNameBytes,
      fieldName: 'Local user display name',
    );

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
    if (rawTransactions.length > maxTransactionCount) {
      throw const FormatException('Backup has too many transactions.');
    }

    try {
      final transactions = <MoneyTransaction>[];
      final transactionIds = <String>{};
      for (final item in rawTransactions) {
        if (item is! Map<String, Object?>) {
          throw const FormatException('Backup has invalid transactions.');
        }

        _validateTransactionText(item);
        final transaction = MoneyTransaction.fromJson(item);
        if (!transactionIds.add(transaction.id)) {
          throw const FormatException(
            'Backup has duplicate transaction identifiers.',
          );
        }
        transactions.add(transaction);
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

    final rawCategoryLimits = rawBudget['categoryLimits'] as Map;
    if (rawCategoryLimits.length > maxBudgetCategoryCount) {
      throw const FormatException('Backup has too many budget categories.');
    }
    final normalizedCategoryNames = <String>{};
    for (final key in rawCategoryLimits.keys) {
      final categoryName = _requireBoundedText(
        key,
        maxBytes: maxBudgetCategoryNameBytes,
        fieldName: 'Budget category name',
      ).trim();
      if (!normalizedCategoryNames.add(categoryName)) {
        throw const FormatException('Backup has duplicate budget categories.');
      }
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

  static void _validateTransactionText(Map<String, Object?> transaction) {
    _requireBoundedText(
      transaction['id'],
      maxBytes: maxTransactionIdBytes,
      fieldName: 'Transaction id',
    );
    _requireBoundedText(
      transaction['type'],
      maxBytes: maxTransactionTypeBytes,
      fieldName: 'Transaction type',
    );
    _requireBoundedText(
      transaction['date'],
      maxBytes: maxTransactionDateBytes,
      fieldName: 'Transaction date',
    );
    _requireBoundedText(
      transaction['category'],
      maxBytes: maxTransactionCategoryBytes,
      fieldName: 'Transaction category',
    );
    _requireBoundedText(
      transaction['paymentMethod'],
      maxBytes: maxPaymentMethodBytes,
      fieldName: 'Transaction payment method',
    );
    _requireBoundedText(
      transaction['description'],
      maxBytes: maxTransactionDescriptionBytes,
      fieldName: 'Transaction description',
    );
  }

  static String _requireBoundedText(
    Object? value, {
    required int maxBytes,
    required String fieldName,
  }) {
    if (value is! String || utf8.encode(value).length > maxBytes) {
      throw FormatException('$fieldName is invalid or too long.');
    }
    return value;
  }

  static void _verifyStagedRestore({
    required LocalAuthRepository authRepository,
    required LocalTransactionRepository transactionRepository,
    required LocalBudgetRepository budgetRepository,
    required ThemePreferenceRepository themeRepository,
    required LocalUser user,
    required List<MoneyTransaction> transactions,
    required BudgetState budget,
    required ThemeMode themeMode,
  }) {
    final stagedUser = authRepository.readSession().user;
    final stagedTransactions = transactionRepository.readTransactions();
    final stagedBudget = budgetRepository.readBudget();
    final stagedThemeMode = themeRepository.readThemeMode();
    final stagedIds = stagedTransactions.map((item) => item.id).toSet();
    final expectedIds = transactions.map((item) => item.id).toSet();
    final budgetMatches =
        stagedBudget.monthlyLimit == budget.monthlyLimit &&
        stagedBudget.categoryLimits.length == budget.categoryLimits.length &&
        budget.categoryLimits.entries.every(
          (entry) => stagedBudget.categoryLimits[entry.key] == entry.value,
        );

    if (stagedUser?.email != user.email ||
        stagedUser?.displayName != user.displayName ||
        stagedTransactions.length != transactions.length ||
        stagedIds.length != expectedIds.length ||
        !stagedIds.containsAll(expectedIds) ||
        !budgetMatches ||
        stagedThemeMode != themeMode) {
      throw StateError('Could not verify staged MoneyKai restore data.');
    }
  }
}
