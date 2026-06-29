import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/presentation/auth_screen.dart';
import '../features/budget/presentation/budget_screen.dart';
import '../features/dashboard/presentation/dashboard_screen.dart';
import '../features/insights/presentation/insights_screen.dart';
import '../features/onboarding/presentation/splash_screen.dart';
import '../features/settings/presentation/local_diagnostics_screen.dart';
import '../features/settings/presentation/privacy_security_screen.dart';
import '../features/settings/presentation/settings_screen.dart';
import '../features/transactions/presentation/add_transaction_screen.dart';
import '../features/transactions/presentation/transactions_screen.dart';
import '../shared/widgets/app_shell.dart';
import 'app_routes.dart';

GoRouter createAppRouter() {
  return GoRouter(
    initialLocation: AppRoutes.splash,
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.signIn,
        builder: (context, state) => const AuthScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.dashboard,
            pageBuilder: (context, state) =>
                NoTransitionPage(child: DashboardScreen()),
          ),
          GoRoute(
            path: AppRoutes.transactions,
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: TransactionsScreen()),
          ),
          GoRoute(
            path: AppRoutes.budget,
            pageBuilder: (context, state) =>
                NoTransitionPage(child: BudgetScreen()),
          ),
          GoRoute(
            path: AppRoutes.insights,
            pageBuilder: (context, state) =>
                NoTransitionPage(child: InsightsScreen()),
          ),
          GoRoute(
            path: AppRoutes.settings,
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: SettingsScreen()),
          ),
        ],
      ),
      GoRoute(
        path: AppRoutes.addTransaction,
        builder: (context, state) => const AddTransactionScreen(),
      ),
      GoRoute(
        path: AppRoutes.editTransaction,
        builder: (context, state) =>
            AddTransactionScreen(transactionId: state.pathParameters['id']),
      ),
      GoRoute(
        path: AppRoutes.privacy,
        builder: (context, state) => const PrivacySecurityScreen(),
      ),
      GoRoute(
        path: AppRoutes.localDiagnostics,
        builder: (context, state) => LocalDiagnosticsScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(title: const Text('MoneyKai')),
      body: Center(child: Text('Route not found: ${state.uri}')),
    ),
  );
}
