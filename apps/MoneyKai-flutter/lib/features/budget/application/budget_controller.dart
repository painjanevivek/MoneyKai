import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_storage_provider.dart';
import '../data/local_budget_repository.dart';
import '../domain/budget_state.dart';

final localBudgetRepositoryProvider = FutureProvider<LocalBudgetRepository>((
  ref,
) async {
  final storage = await ref.watch(localStorageServiceProvider.future);
  return LocalBudgetRepository(storage);
});

final budgetControllerProvider =
    AsyncNotifierProvider<BudgetController, BudgetState>(BudgetController.new);

class BudgetController extends AsyncNotifier<BudgetState> {
  @override
  Future<BudgetState> build() async {
    final repository = await ref.watch(localBudgetRepositoryProvider.future);
    return repository.readBudget();
  }

  Future<void> updateMonthlyLimit(double limit) async {
    await _save((budget) => budget.copyWith(monthlyLimit: limit));
  }

  Future<void> updateCategoryLimit(String category, double limit) async {
    await _save((budget) {
      final nextLimits = Map<String, double>.from(budget.categoryLimits);
      nextLimits[category] = limit;
      return budget.copyWith(categoryLimits: nextLimits);
    });
  }

  Future<void> resetBudget() async {
    state = await AsyncValue.guard(() async {
      final repository = await ref.read(localBudgetRepositoryProvider.future);
      await repository.resetBudget();
      return BudgetState.initial();
    });
  }

  Future<void> _save(BudgetState Function(BudgetState budget) update) async {
    state = await AsyncValue.guard(() async {
      final repository = await ref.read(localBudgetRepositoryProvider.future);
      final current = state.asData?.value ?? repository.readBudget();
      final next = update(current);
      await repository.saveBudget(next);
      return next;
    });
  }
}
