import 'package:flutter/material.dart';

import '../../core/formatters/money_formatter.dart';
import '../../features/budget/application/budget_progress.dart';
import '../../theme/app_tokens.dart';

class BudgetProgressCard extends StatelessWidget {
  BudgetProgressCard({required this.progress, super.key});

  final BudgetProgress progress;
  final MoneyFormatter _money = MoneyFormatter();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = progress.isOverBudget
        ? colorScheme.error
        : colorScheme.primary;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Monthly budget',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: AppSpacing.md),
            LinearProgressIndicator(
              value: progress.monthlyRatio,
              color: color,
              backgroundColor: colorScheme.surfaceContainerHighest,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              '${_money.format(progress.monthlySpent)} of ${_money.format(progress.monthlyLimit)} used',
              style: TextStyle(color: color),
            ),
          ],
        ),
      ),
    );
  }
}
