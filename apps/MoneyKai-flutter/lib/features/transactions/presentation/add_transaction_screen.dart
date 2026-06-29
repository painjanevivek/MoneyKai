import 'package:flutter/material.dart';

import '../../../shared/widgets/screen_scaffold.dart';

class AddTransactionScreen extends StatelessWidget {
  const AddTransactionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenScaffold(
      title: 'Add transaction',
      subtitle:
          'Form structure is in place; validation and persistence land with the transactions feature.',
      actions: [
        IconButton(
          tooltip: 'Close',
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.close),
        ),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const TextField(
            decoration: InputDecoration(labelText: 'Amount'),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 12),
          const TextField(decoration: InputDecoration(labelText: 'Category')),
          const SizedBox(height: 12),
          const TextField(
            decoration: InputDecoration(labelText: 'Description'),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Transaction save is coming in the next feature phase.',
                  ),
                ),
              );
            },
            child: const Text('Save transaction - coming soon'),
          ),
        ],
      ),
    );
  }
}
