import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../routing/app_routes.dart';

class AppShell extends StatelessWidget {
  const AppShell({required this.child, super.key});

  final Widget child;

  static const _tabs = [
    _AppTab('Dashboard', Icons.dashboard_outlined, AppRoutes.dashboard),
    _AppTab('Transactions', Icons.swap_horiz, AppRoutes.transactions),
    _AppTab('Budget', Icons.account_balance_wallet_outlined, AppRoutes.budget),
    _AppTab('Insights', Icons.insights_outlined, AppRoutes.insights),
    _AppTab('Settings', Icons.settings_outlined, AppRoutes.settings),
  ];

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final selectedIndex = _tabs.indexWhere((tab) => location == tab.route);

    return Scaffold(
      body: SafeArea(child: child),
      bottomNavigationBar: MediaQuery.withClampedTextScaling(
        maxScaleFactor: 1,
        child: NavigationBar(
          selectedIndex: selectedIndex < 0 ? 0 : selectedIndex,
          onDestinationSelected: (index) => context.go(_tabs[index].route),
          destinations: [
            for (final tab in _tabs)
              NavigationDestination(icon: Icon(tab.icon), label: tab.label),
          ],
        ),
      ),
    );
  }
}

class _AppTab {
  const _AppTab(this.label, this.icon, this.route);

  final String label;
  final IconData icon;
  final String route;
}
