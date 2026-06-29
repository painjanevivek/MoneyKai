import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/formatters/money_formatter.dart';
import '../../../routing/app_routes.dart';
import '../../../shared/widgets/budget_progress_card.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/metric_card.dart';
import '../../../shared/widgets/screen_scaffold.dart';
import '../../../theme/app_tokens.dart';
import '../../budget/application/budget_controller.dart';
import '../../budget/application/budget_progress.dart';
import '../../transactions/application/transaction_controller.dart';
import '../../transactions/domain/money_transaction.dart';
import '../../transactions/domain/transaction_type.dart';

class DashboardScreen extends ConsumerWidget {
  DashboardScreen({super.key});

  final MoneyFormatter _money = MoneyFormatter();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactions = ref.watch(transactionControllerProvider);
    final budget = ref.watch(budgetControllerProvider);

    final transactionList = transactions.asData?.value ?? const [];
    final budgetState = budget.asData?.value;
    final summary = _DashboardSummary.fromTransactions(transactionList);
    final budgetProgress = budgetState == null
        ? null
        : calculateBudgetProgress(
            budget: budgetState,
            transactions: transactionList,
          );

    return ScreenScaffold(
      title: 'Dashboard',
      subtitle:
          'A clean monthly view for local income, expenses, and budget progress.',
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          GridView.count(
            crossAxisCount: MediaQuery.sizeOf(context).width >= 600 ? 4 : 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: MediaQuery.sizeOf(context).width >= 600
                ? 1.08
                : 0.86,
            children: [
              MetricCard(
                label: 'Balance',
                value: _money.format(summary.balance),
                icon: Icons.savings_outlined,
              ),
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
                label: 'Records',
                value: transactionList.length.toString(),
                icon: Icons.receipt_long_outlined,
              ),
            ],
          ),
          if (budgetProgress != null) ...[
            const SizedBox(height: AppSpacing.xl),
            BudgetProgressCard(progress: budgetProgress),
          ],
          const SizedBox(height: AppSpacing.xl),
          FilledButton.icon(
            onPressed: () => context.push(AppRoutes.addTransaction),
            icon: const Icon(Icons.add),
            label: const Text('Add transaction'),
          ),
          const SizedBox(height: AppSpacing.md),
          OutlinedButton(
            onPressed: () => context.go(AppRoutes.budget),
            child: const Text('Review budget'),
          ),
          const SizedBox(height: AppSpacing.xl),
          _RecentActivity(transactions: transactionList.take(3).toList()),
        ],
      ),
    );
  }
}

class _RecentActivity extends StatelessWidget {
  const _RecentActivity({required this.transactions});

  final List<MoneyTransaction> transactions;

  @override
  Widget build(BuildContext context) {
    if (transactions.isEmpty) {
      return const EmptyState(
        title: 'No recent activity',
        body: 'Add a transaction to populate your monthly overview.',
        icon: Icons.history,
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Recent activity',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: AppSpacing.md),
            for (final transaction in transactions)
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(transaction.description),
                subtitle: Text(transaction.category),
                trailing: Text(
                  MoneyFormatter().format(transaction.amount),
                  style: TextStyle(
                    color: transaction.type == TransactionType.income
                        ? Theme.of(context).colorScheme.primary
                        : Theme.of(context).colorScheme.error,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _DashboardSummary {
  const _DashboardSummary({required this.income, required this.expense});

  final double income;
  final double expense;

  double get balance => income - expense;

  static _DashboardSummary fromTransactions(
    List<MoneyTransaction> transactions,
  ) {
    var income = 0.0;
    var expense = 0.0;

    for (final transaction in transactions) {
      if (transaction.type == TransactionType.income) {
        income += transaction.amount;
      } else {
        expense += transaction.amount;
      }
    }

    return _DashboardSummary(income: income, expense: expense);
  }
}
