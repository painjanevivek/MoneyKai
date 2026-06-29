import 'package:flutter/material.dart';

import '../../../shared/widgets/screen_scaffold.dart';

class BudgetScreen extends StatelessWidget {
  const BudgetScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenScaffold(
      title: 'Budget',
      subtitle:
          'Monthly and category budget progress will be stored locally first.',
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const LinearProgressIndicator(value: 0),
          const SizedBox(height: 12),
          Text(
            'Rs 0 of Rs 25,000 used',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Budget editing is coming in the budget feature phase.',
                  ),
                ),
              );
            },
            child: const Text('Update budget - coming soon'),
          ),
        ],
      ),
    );
  }
}
