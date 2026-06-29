import 'dart:convert';

import '../../../core/storage/local_storage_service.dart';
import '../domain/budget_state.dart';

class LocalBudgetRepository {
  LocalBudgetRepository(this._storage);

  static const _budgetKey = 'moneykai.budget';

  final LocalStorageService _storage;

  BudgetState readBudget() {
    final raw = _storage.readString(_budgetKey);
    if (raw == null) {
      return BudgetState.initial();
    }

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map<String, Object?>) {
        return BudgetState.initial();
      }

      return BudgetState.fromJson(decoded);
    } catch (_) {
      return BudgetState.initial();
    }
  }

  Future<void> saveBudget(BudgetState budget) {
    if (!budget.monthlyLimit.isFinite || budget.monthlyLimit <= 0) {
      throw const FormatException(
        'Monthly budget limit must be finite and greater than zero.',
      );
    }

    for (final limit in budget.categoryLimits.values) {
      if (!limit.isFinite || limit <= 0) {
        throw const FormatException(
          'Category budget limits must be finite and greater than zero.',
        );
      }
    }

    return _storage.writeString(_budgetKey, jsonEncode(budget.toJson()));
  }

  Future<void> resetBudget() {
    return _storage.remove(_budgetKey);
  }
}
