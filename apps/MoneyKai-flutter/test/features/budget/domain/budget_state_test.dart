import 'package:flutter_test/flutter_test.dart';
import 'package:moneykai/features/budget/domain/budget_state.dart';

void main() {
  test('serializes a valid budget state with trimmed category names', () {
    const budget = BudgetState(
      monthlyLimit: 25000,
      categoryLimits: {' Food ': 8000},
    );

    expect(budget.toJson(), {
      'monthlyLimit': 25000,
      'categoryLimits': {'Food': 8000},
    });
  });

  test('rejects invalid limits during serialization', () {
    const budget = BudgetState(
      monthlyLimit: 25000,
      categoryLimits: {'Food': double.infinity},
    );

    expect(budget.toJson, throwsA(isA<FormatException>()));
  });

  test('rejects blank category names during serialization', () {
    const budget = BudgetState(
      monthlyLimit: 25000,
      categoryLimits: {' ': 8000},
    );

    expect(budget.toJson, throwsA(isA<FormatException>()));
  });
}
