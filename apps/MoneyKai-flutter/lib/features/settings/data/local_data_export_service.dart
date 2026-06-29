import 'dart:convert';

import '../../auth/data/local_auth_repository.dart';
import '../../budget/data/local_budget_repository.dart';
import '../../transactions/data/local_transaction_repository.dart';
import 'theme_preference_repository.dart';

class LocalDataExportService {
  LocalDataExportService({
    required this.authRepository,
    required this.transactionRepository,
    required this.budgetRepository,
    required this.themeRepository,
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now;

  final LocalAuthRepository authRepository;
  final LocalTransactionRepository transactionRepository;
  final LocalBudgetRepository budgetRepository;
  final ThemePreferenceRepository themeRepository;
  final DateTime Function() _now;

  static const exportFormatVersion = 2;

  String buildExportJson() {
    final session = authRepository.readSession();
    final transactions = transactionRepository.readTransactions();
    final budget = budgetRepository.readBudget();
    final themeMode = themeRepository.readThemeMode();

    final payload = {
      'formatVersion': exportFormatVersion,
      'exportedAt': _now().toUtc().toIso8601String(),
      'source': 'moneykai-local-device',
      'user': session.user?.toJson(),
      'transactions': [
        for (final transaction in transactions) transaction.toJson(),
      ],
      'budget': budget.toJson(),
      'settings': {'themeMode': themeMode.name},
    };

    return const JsonEncoder.withIndent('  ').convert(payload);
  }
}
