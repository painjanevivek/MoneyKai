import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

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
    final monthlyTrend = summary.monthlyTrend.entries.take(4).toList();

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
            MetricCard(
              label: 'Savings rate',
              value: summary.formattedSavingsRate,
              icon: Icons.trending_up,
            ),
            MetricCard(
              label: 'Net savings',
              value: _money.format(summary.netSavings),
              icon: Icons.account_balance_wallet_outlined,
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
        const SizedBox(height: AppSpacing.xl),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Monthly trend'),
                const SizedBox(height: AppSpacing.md),
                for (final month in monthlyTrend)
                  _MonthlyTrendRow(month: month.key, summary: month.value),
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
    required this.monthlyTrend,
  });

  final double income;
  final double expense;
  final Map<String, double> topExpenseCategories;
  final Map<String, _MonthlyInsight> monthlyTrend;

  double get netSavings => income - expense;

  String get formattedSavingsRate {
    if (income <= 0) {
      return '0%';
    }

    final rate = (netSavings / income) * 100;
    return '${rate.clamp(-999, 999).round()}%';
  }

  static _InsightSummary fromTransactions(List<MoneyTransaction> transactions) {
    var income = 0.0;
    var expense = 0.0;
    final categoryTotals = <String, double>{};
    final monthlyTotals = <DateTime, _MonthlyInsight>{};

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

      final month = DateTime(transaction.date.year, transaction.date.month);
      final current = monthlyTotals[month] ?? const _MonthlyInsight();
      monthlyTotals[month] = transaction.type == TransactionType.income
          ? current.copyWith(income: current.income + transaction.amount)
          : current.copyWith(expense: current.expense + transaction.amount);
    }

    final sortedCategories = categoryTotals.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final monthFormatter = DateFormat('MMM yyyy');
    final sortedMonths = monthlyTotals.entries.toList()
      ..sort((a, b) => b.key.compareTo(a.key));

    return _InsightSummary(
      income: income,
      expense: expense,
      topExpenseCategories: Map.fromEntries(sortedCategories),
      monthlyTrend: {
        for (final entry in sortedMonths)
          monthFormatter.format(entry.key): entry.value,
      },
    );
  }
}

class _MonthlyInsight {
  const _MonthlyInsight({this.income = 0, this.expense = 0});

  final double income;
  final double expense;

  double get net => income - expense;

  _MonthlyInsight copyWith({double? income, double? expense}) {
    return _MonthlyInsight(
      income: income ?? this.income,
      expense: expense ?? this.expense,
    );
  }
}

class _MonthlyTrendRow extends StatelessWidget {
  _MonthlyTrendRow({required this.month, required this.summary});

  final String month;
  final _MonthlyInsight summary;
  final MoneyFormatter _money = MoneyFormatter();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final netColor = summary.net >= 0 ? colorScheme.primary : colorScheme.error;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(month, style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: AppSpacing.xs),
          Wrap(
            spacing: AppSpacing.md,
            runSpacing: AppSpacing.xs,
            children: [
              Text('Income ${_money.format(summary.income)}'),
              Text('Expense ${_money.format(summary.expense)}'),
              Text(
                'Net ${_money.format(summary.net)}',
                style: TextStyle(color: netColor, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
