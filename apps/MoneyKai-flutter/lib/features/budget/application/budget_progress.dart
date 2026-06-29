import '../../transactions/domain/money_transaction.dart';
import '../../transactions/domain/transaction_type.dart';
import '../domain/budget_state.dart';

class BudgetProgress {
  const BudgetProgress({
    required this.monthlySpent,
    required this.monthlyLimit,
    required this.categorySpent,
    required this.categoryLimits,
  });

  final double monthlySpent;
  final double monthlyLimit;
  final Map<String, double> categorySpent;
  final Map<String, double> categoryLimits;

  double get monthlyRatio =>
      monthlyLimit <= 0 ? 0 : (monthlySpent / monthlyLimit).clamp(0, 1);

  bool get isOverBudget => monthlySpent > monthlyLimit;
}

BudgetProgress calculateBudgetProgress({
  required BudgetState budget,
  required List<MoneyTransaction> transactions,
  DateTime? now,
}) {
  final today = now ?? DateTime.now();
  final categorySpent = <String, double>{};
  var monthlySpent = 0.0;

  for (final transaction in transactions) {
    final isCurrentMonth =
        transaction.date.year == today.year &&
        transaction.date.month == today.month;
    if (!isCurrentMonth || transaction.type != TransactionType.expense) {
      continue;
    }

    monthlySpent += transaction.amount;
    categorySpent.update(
      transaction.category,
      (value) => value + transaction.amount,
      ifAbsent: () => transaction.amount,
    );
  }

  return BudgetProgress(
    monthlySpent: monthlySpent,
    monthlyLimit: budget.monthlyLimit,
    categorySpent: categorySpent,
    categoryLimits: budget.categoryLimits,
  );
}
