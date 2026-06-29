import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../routing/app_routes.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/screen_scaffold.dart';
import '../../../theme/app_tokens.dart';

class TransactionsScreen extends StatelessWidget {
  const TransactionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenScaffold(
      title: 'Transactions',
      subtitle:
          'Search, filter, and maintain the records that power budgets and insights.',
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SearchBar(
            leading: Icon(Icons.search),
            hintText: 'Search transactions',
          ),
          const SizedBox(height: AppSpacing.lg),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'all', label: Text('All')),
              ButtonSegment(value: 'income', label: Text('Income')),
              ButtonSegment(value: 'expense', label: Text('Expense')),
            ],
            selected: const {'all'},
            onSelectionChanged: (_) {},
          ),
          const SizedBox(height: AppSpacing.xl),
          OutlinedButton.icon(
            onPressed: () => context.push(AppRoutes.addTransaction),
            icon: const Icon(Icons.add),
            label: const Text('Add transaction'),
          ),
          const SizedBox(height: AppSpacing.xl),
          const EmptyState(
            title: 'No local transactions yet',
            body:
                'Transaction persistence is wired in the next implementation phase.',
          ),
        ],
      ),
    );
  }
}
