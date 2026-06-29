import 'dart:convert';

import '../../auth/data/local_auth_repository.dart';
import '../../budget/data/local_budget_repository.dart';
import '../../transactions/data/local_transaction_repository.dart';

class LocalDataExportService {
  LocalDataExportService({
    required this.authRepository,
    required this.transactionRepository,
    required this.budgetRepository,
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now;

  final LocalAuthRepository authRepository;
  final LocalTransactionRepository transactionRepository;
  final LocalBudgetRepository budgetRepository;
  final DateTime Function() _now;

  static const exportFormatVersion = 1;

  String buildExportJson() {
    final session = authRepository.readSession();
    final transactions = transactionRepository.readTransactions();
    final budget = budgetRepository.readBudget();

    final payload = {
      'formatVersion': exportFormatVersion,
      'exportedAt': _now().toUtc().toIso8601String(),
      'source': 'moneykai-local-device',
      'user': session.user?.toJson(),
      'transactions': [
        for (final transaction in transactions) transaction.toJson(),
      ],
      'budget': budget.toJson(),
    };

    return const JsonEncoder.withIndent('  ').convert(payload);
  }
}
