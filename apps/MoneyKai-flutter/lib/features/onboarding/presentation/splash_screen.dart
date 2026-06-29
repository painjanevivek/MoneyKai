import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../routing/app_routes.dart';
import '../../auth/application/auth_controller.dart';

class SplashScreen extends ConsumerWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final textTheme = Theme.of(context).textTheme;
    final authState = ref.watch(authControllerProvider);

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
              authState.when(
                loading: () => const LinearProgressIndicator(),
                error: (error, stackTrace) => FilledButton(
                  onPressed: () => context.go(AppRoutes.signIn),
                  child: const Text('Continue'),
                ),
                data: (session) => FilledButton(
                  onPressed: () => context.go(
                    session.isAuthenticated
                        ? AppRoutes.dashboard
                        : AppRoutes.signIn,
                  ),
                  child: Text(
                    session.isAuthenticated ? 'Open dashboard' : 'Continue',
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
