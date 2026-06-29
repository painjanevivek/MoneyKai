import 'package:flutter/material.dart';

import '../../../shared/widgets/screen_scaffold.dart';

class InsightsScreen extends StatelessWidget {
  const InsightsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ScreenScaffold(
      title: 'Insights',
      subtitle:
          'Reports will stay factual and local: no fake investment or AI advice.',
      body: Card(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Text(
            'Income vs expense, top categories, and monthly trend charts are planned for the insights feature phase.',
          ),
        ),
      ),
    );
  }
}
