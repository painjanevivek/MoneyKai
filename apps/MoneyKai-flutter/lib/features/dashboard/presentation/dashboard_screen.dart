import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/formatters/money_formatter.dart';
import '../../../routing/app_routes.dart';
import '../../../shared/widgets/metric_card.dart';
import '../../../shared/widgets/screen_scaffold.dart';

class DashboardScreen extends StatelessWidget {
  DashboardScreen({super.key});

  final MoneyFormatter _money = MoneyFormatter();

  @override
  Widget build(BuildContext context) {
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
            childAspectRatio: 1.2,
            children: [
              MetricCard(
                label: 'Balance',
                value: _money.format(24000),
                icon: Icons.savings_outlined,
              ),
              MetricCard(
                label: 'Income',
                value: _money.format(24000),
                icon: Icons.arrow_downward,
              ),
              MetricCard(
                label: 'Expense',
                value: _money.format(0),
                icon: Icons.arrow_upward,
              ),
              const MetricCard(
                label: 'Budget used',
                value: '0%',
                icon: Icons.pie_chart_outline,
              ),
            ],
          ),
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: () => context.push(AppRoutes.addTransaction),
            icon: const Icon(Icons.add),
            label: const Text('Add transaction'),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => context.go(AppRoutes.budget),
            child: const Text('Review budget'),
          ),
        ],
      ),
    );
  }
}
