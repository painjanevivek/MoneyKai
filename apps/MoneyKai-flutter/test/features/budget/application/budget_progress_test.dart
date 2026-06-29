import 'package:flutter_test/flutter_test.dart';
import 'package:moneykai/features/budget/application/budget_progress.dart';
import 'package:moneykai/features/budget/domain/budget_state.dart';
import 'package:moneykai/features/transactions/domain/money_transaction.dart';
import 'package:moneykai/features/transactions/domain/transaction_type.dart';

void main() {
  test('calculates current-month expense progress by category', () {
    final progress = calculateBudgetProgress(
      budget: const BudgetState(
        monthlyLimit: 1000,
        categoryLimits: {'Food': 600},
      ),
      now: DateTime(2026, 6, 15),
      transactions: [
        MoneyTransaction(
          id: '1',
          type: TransactionType.expense,
          amount: 250,
          date: DateTime(2026, 6, 10),
          category: 'Food',
          paymentMethod: 'UPI',
          description: 'Lunch',
        ),
        MoneyTransaction(
          id: '2',
          type: TransactionType.income,
          amount: 5000,
          date: DateTime(2026, 6, 11),
          category: 'Salary',
          paymentMethod: 'Bank transfer',
          description: 'Salary',
        ),
        MoneyTransaction(
          id: '3',
          type: TransactionType.expense,
          amount: 700,
          date: DateTime(2026, 5, 30),
          category: 'Food',
          paymentMethod: 'UPI',
          description: 'Old lunch',
        ),
      ],
    );

    expect(progress.monthlySpent, 250);
    expect(progress.categorySpent['Food'], 250);
    expect(progress.monthlyRatio, 0.25);
    expect(progress.isOverBudget, isFalse);
    expect(progress.categoryRatio('Food'), closeTo(0.416, 0.001));
    expect(progress.isCategoryOverBudget('Food'), isFalse);
    expect(progress.categoryOverage('Food'), 0);
  });

  test('reports category over-budget state and overage', () {
    final progress = calculateBudgetProgress(
      budget: const BudgetState(
        monthlyLimit: 2000,
        categoryLimits: {'Food': 600},
      ),
      now: DateTime(2026, 6, 15),
      transactions: [
        MoneyTransaction(
          id: '1',
          type: TransactionType.expense,
          amount: 750,
          date: DateTime(2026, 6, 10),
          category: 'Food',
          paymentMethod: 'UPI',
          description: 'Groceries',
        ),
      ],
    );

    expect(progress.categoryRatio('Food'), 1);
    expect(progress.isCategoryOverBudget('Food'), isTrue);
    expect(progress.categoryOverage('Food'), 150);
  });
}
