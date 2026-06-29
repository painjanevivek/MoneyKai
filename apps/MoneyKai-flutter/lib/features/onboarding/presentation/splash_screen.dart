import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../routing/app_routes.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              Icon(
                Icons.account_balance_wallet_outlined,
                size: 56,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(height: 24),
              Text('MoneyKai', style: textTheme.displaySmall),
              const SizedBox(height: 12),
              Text(
                'Track spending, budgets, and local money habits without pretending sync exists before it does.',
                style: textTheme.titleMedium,
              ),
              const Spacer(),
              FilledButton(
                onPressed: () => context.go(AppRoutes.signIn),
                child: const Text('Continue'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
