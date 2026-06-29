import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:moneykai/core/storage/local_storage_service.dart';
import 'package:moneykai/features/budget/data/local_budget_repository.dart';
import 'package:moneykai/features/budget/domain/budget_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('saves and restores monthly and category budget limits', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalBudgetRepository(LocalStorageService(preferences));

    expect(repository.readBudget().monthlyLimit, 25000);

    await repository.saveBudget(
      const BudgetState(
        monthlyLimit: 42000,
        categoryLimits: {'Food': 12000, 'Transport': 5000},
      ),
    );

    final restored = repository.readBudget();
    expect(restored.monthlyLimit, 42000);
    expect(restored.categoryLimits['Food'], 12000);

    await repository.resetBudget();
    expect(repository.readBudget().monthlyLimit, 25000);
  });

  test('returns default budget for malformed stored budget', () async {
    SharedPreferences.setMockInitialValues({'moneykai.budget': '{bad'});
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalBudgetRepository(LocalStorageService(preferences));

    final budget = repository.readBudget();
    expect(budget.monthlyLimit, BudgetState.initial().monthlyLimit);
    expect(budget.categoryLimits, BudgetState.defaultCategoryLimits);
  });

  test('returns default budget for invalid category limits', () async {
    SharedPreferences.setMockInitialValues({
      'moneykai.budget':
          '{"monthlyLimit":42000,"categoryLimits":{"Food":"bad"}}',
    });
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalBudgetRepository(LocalStorageService(preferences));

    final budget = repository.readBudget();
    expect(budget.monthlyLimit, BudgetState.initial().monthlyLimit);
    expect(budget.categoryLimits, BudgetState.defaultCategoryLimits);
  });

  test('returns default budget for blank stored category names', () async {
    SharedPreferences.setMockInitialValues({
      'moneykai.budget': jsonEncode({
        'monthlyLimit': 42000,
        'categoryLimits': {' ': 12000},
      }),
    });
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalBudgetRepository(LocalStorageService(preferences));

    final budget = repository.readBudget();
    expect(budget.monthlyLimit, BudgetState.initial().monthlyLimit);
    expect(budget.categoryLimits, BudgetState.defaultCategoryLimits);
  });

  test('returns default budget for non-positive stored limits', () async {
    SharedPreferences.setMockInitialValues({
      'moneykai.budget':
          '{"monthlyLimit":0,"categoryLimits":{"Food":12000,"Transport":-1}}',
    });
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalBudgetRepository(LocalStorageService(preferences));

    final budget = repository.readBudget();
    expect(budget.monthlyLimit, BudgetState.initial().monthlyLimit);
    expect(budget.categoryLimits, BudgetState.defaultCategoryLimits);
  });

  test('rejects non-finite budget values before saving', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalBudgetRepository(LocalStorageService(preferences));

    expect(
      () => repository.saveBudget(
        const BudgetState(monthlyLimit: double.infinity, categoryLimits: {}),
      ),
      throwsA(isA<FormatException>()),
    );
    expect(
      () => repository.saveBudget(
        const BudgetState(
          monthlyLimit: 25000,
          categoryLimits: {'Food': double.nan},
        ),
      ),
      throwsA(isA<FormatException>()),
    );
    expect(preferences.getString('moneykai.budget'), isNull);
  });

  test('rejects blank category names before saving budget', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalBudgetRepository(LocalStorageService(preferences));

    expect(
      () => repository.saveBudget(
        const BudgetState(monthlyLimit: 25000, categoryLimits: {' ': 12000}),
      ),
      throwsA(isA<FormatException>()),
    );
    expect(preferences.getString('moneykai.budget'), isNull);
  });
}
