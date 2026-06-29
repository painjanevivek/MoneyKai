import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/formatters/money_formatter.dart';
import '../../../shared/widgets/budget_progress_card.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/screen_scaffold.dart';
import '../../../theme/app_tokens.dart';
import '../../transactions/application/transaction_controller.dart';
import '../application/budget_controller.dart';
import '../application/budget_progress.dart';

class BudgetScreen extends ConsumerWidget {
  BudgetScreen({super.key});

  final MoneyFormatter _money = MoneyFormatter();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final budget = ref.watch(budgetControllerProvider);
    final transactions = ref.watch(transactionControllerProvider);

    return ScreenScaffold(
      title: 'Budget',
      subtitle:
          'Set monthly and category limits. Expense transactions update progress automatically.',
      body: budget.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => EmptyState(
          title: 'Budget unavailable',
          body: 'Local budget data could not be loaded.',
          icon: Icons.error_outline,
          action: OutlinedButton(
            onPressed: () => ref.invalidate(budgetControllerProvider),
            child: const Text('Retry'),
          ),
        ),
        data: (budgetState) {
          final transactionList = transactions.asData?.value ?? const [];
          final progress = calculateBudgetProgress(
            budget: budgetState,
            transactions: transactionList,
          );

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              BudgetProgressCard(progress: progress),
              const SizedBox(height: AppSpacing.xl),
              _BudgetLimitTile(
                title: 'Monthly limit',
                value: budgetState.monthlyLimit,
                supportingText: progress.isOverBudget
                    ? 'Over by ${_money.format(progress.monthlySpent - progress.monthlyLimit)}'
                    : '${_money.format(progress.monthlyLimit - progress.monthlySpent)} remaining',
                onSave: (value) => ref
                    .read(budgetControllerProvider.notifier)
                    .updateMonthlyLimit(value),
              ),
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Category limits',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: AppSpacing.md),
              for (final entry in budgetState.categoryLimits.entries)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.md),
                  child: _CategoryBudgetTile(
                    category: entry.key,
                    limit: entry.value,
                    spent: progress.categorySpent[entry.key] ?? 0,
                    onSave: (value) => ref
                        .read(budgetControllerProvider.notifier)
                        .updateCategoryLimit(entry.key, value),
                  ),
                ),
              OutlinedButton.icon(
                onPressed: () =>
                    ref.read(budgetControllerProvider.notifier).resetBudget(),
                icon: const Icon(Icons.restart_alt),
                label: const Text('Reset budget defaults'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _CategoryBudgetTile extends StatelessWidget {
  const _CategoryBudgetTile({
    required this.category,
    required this.limit,
    required this.spent,
    required this.onSave,
  });

  final String category;
  final double limit;
  final double spent;
  final ValueChanged<double> onSave;

  @override
  Widget build(BuildContext context) {
    final ratio = limit <= 0 ? 0.0 : (spent / limit).clamp(0.0, 1.0);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _BudgetLimitTile(
              title: category,
              value: limit,
              supportingText: MoneyFormatter().format(spent),
              onSave: onSave,
            ),
            const SizedBox(height: AppSpacing.sm),
            LinearProgressIndicator(value: ratio),
          ],
        ),
      ),
    );
  }
}

class _BudgetLimitTile extends StatefulWidget {
  const _BudgetLimitTile({
    required this.title,
    required this.value,
    required this.supportingText,
    required this.onSave,
  });

  final String title;
  final double value;
  final String supportingText;
  final ValueChanged<double> onSave;

  @override
  State<_BudgetLimitTile> createState() => _BudgetLimitTileState();
}

class _BudgetLimitTileState extends State<_BudgetLimitTile> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.value.toStringAsFixed(0));
  }

  @override
  void didUpdateWidget(covariant _BudgetLimitTile oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      _controller.text = widget.value.toStringAsFixed(0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: TextField(
            controller: _controller,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              labelText: widget.title,
              helperText: widget.supportingText,
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        IconButton.filled(
          tooltip: 'Save ${widget.title}',
          onPressed: _save,
          icon: const Icon(Icons.check),
        ),
      ],
    );
  }

  void _save() {
    final value = double.tryParse(_controller.text);
    if (value == null || value <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a budget greater than zero.')),
      );
      return;
    }

    widget.onSave(value);
  }
}
