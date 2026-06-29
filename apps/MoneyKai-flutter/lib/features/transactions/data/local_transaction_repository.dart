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

    final decoded = jsonDecode(raw);
    if (decoded is! List) {
      return const [];
    }

    final transactions = decoded
        .whereType<Map<String, Object?>>()
        .map(MoneyTransaction.fromJson)
        .toList();

    transactions.sort((a, b) => b.date.compareTo(a.date));
    return transactions;
  }

  Future<void> saveTransactions(List<MoneyTransaction> transactions) {
    final encoded = jsonEncode([
      for (final transaction in transactions) transaction.toJson(),
    ]);
    return _storage.writeString(_transactionsKey, encoded);
  }
}
