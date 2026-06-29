import 'dart:convert';

import '../../../core/storage/local_storage_service.dart';
import '../domain/money_transaction.dart';

class LocalTransactionRepository {
  LocalTransactionRepository(this._storage);

  static const _transactionsKey = 'moneykai.transactions';

  final LocalStorageService _storage;

  List<MoneyTransaction> readTransactions() {
    final raw = _storage.readString(_transactionsKey);
    if (raw == null) {
      return const [];
    }

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) {
        return const [];
      }

      final transactions = <MoneyTransaction>[];
      for (final item in decoded) {
        if (item is! Map<String, Object?>) {
          continue;
        }

        try {
          transactions.add(MoneyTransaction.fromJson(item));
        } catch (_) {
          continue;
        }
      }

      transactions.sort((a, b) => b.date.compareTo(a.date));
      return transactions;
    } catch (_) {
      return const [];
    }
  }

  Future<void> saveTransactions(List<MoneyTransaction> transactions) {
    for (final transaction in transactions) {
      if (!transaction.amount.isFinite || transaction.amount <= 0) {
        throw const FormatException(
          'Transaction amount must be finite and greater than zero.',
        );
      }
    }

    final encoded = jsonEncode([
      for (final transaction in transactions) transaction.toJson(),
    ]);
    return _storage.writeString(_transactionsKey, encoded);
  }
}
