import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../routing/app_routes.dart';
import '../../../shared/widgets/screen_scaffold.dart';

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
          const SizedBox(height: 16),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'all', label: Text('All')),
              ButtonSegment(value: 'income', label: Text('Income')),
              ButtonSegment(value: 'expense', label: Text('Expense')),
            ],
            selected: const {'all'},
            onSelectionChanged: (_) {},
          ),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: () => context.push(AppRoutes.addTransaction),
            icon: const Icon(Icons.add),
            label: const Text('Add transaction'),
          ),
          const SizedBox(height: 20),
          const Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Text(
                'Transaction persistence is wired in the next implementation phase.',
              ),
            ),
          ),
        ],
      ),
    );
  }
}
