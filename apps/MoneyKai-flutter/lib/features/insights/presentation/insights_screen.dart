import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/formatters/money_formatter.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/metric_card.dart';
import '../../../shared/widgets/screen_scaffold.dart';
import '../../../theme/app_tokens.dart';
import '../../transactions/application/transaction_controller.dart';
import '../../transactions/domain/money_transaction.dart';
import '../../transactions/domain/transaction_type.dart';

class InsightsScreen extends ConsumerWidget {
  InsightsScreen({super.key});

  final MoneyFormatter _money = MoneyFormatter();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactions = ref.watch(transactionControllerProvider);

    return ScreenScaffold(
      title: 'Insights',
      subtitle:
          'Reports stay factual and local: no fake investment or AI advice.',
      body: transactions.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => const EmptyState(
          title: 'Insights unavailable',
          body: 'Local transaction data could not be loaded.',
          icon: Icons.error_outline,
        ),
        data: _buildInsights,
      ),
    );
  }

  Widget _buildInsights(List<MoneyTransaction> transactions) {
    if (transactions.isEmpty) {
      return const EmptyState(
        title: 'No insights yet',
        body: 'Add income and expenses to generate local reports.',
        icon: Icons.insights_outlined,
      );
    }

    final summary = _InsightSummary.fromTransactions(transactions);
    final topCategories = summary.topExpenseCategories.entries.take(5).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: AppSpacing.md,
          mainAxisSpacing: AppSpacing.md,
          childAspectRatio: 1.2,
          children: [
            MetricCard(
              label: 'Income',
              value: _money.format(summary.income),
              icon: Icons.arrow_downward,
            ),
            MetricCard(
              label: 'Expense',
              value: _money.format(summary.expense),
              icon: Icons.arrow_upward,
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xl),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Top spending categories'),
                const SizedBox(height: AppSpacing.md),
                if (topCategories.isEmpty)
                  const Text('No expense categories yet.')
                else
                  for (final category in topCategories)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(category.key),
                      trailing: Text(_money.format(category.value)),
                    ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _InsightSummary {
  const _InsightSummary({
    required this.income,
    required this.expense,
    required this.topExpenseCategories,
  });

  final double income;
  final double expense;
  final Map<String, double> topExpenseCategories;

  static _InsightSummary fromTransactions(List<MoneyTransaction> transactions) {
    var income = 0.0;
    var expense = 0.0;
    final categoryTotals = <String, double>{};

    for (final transaction in transactions) {
      if (transaction.type == TransactionType.income) {
        income += transaction.amount;
      } else {
        expense += transaction.amount;
        categoryTotals.update(
          transaction.category,
          (value) => value + transaction.amount,
          ifAbsent: () => transaction.amount,
        );
      }
    }

    final sortedCategories = categoryTotals.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return _InsightSummary(
      income: income,
      expense: expense,
      topExpenseCategories: Map.fromEntries(sortedCategories),
    );
  }
}
