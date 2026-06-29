import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../routing/app_routes.dart';
import '../../../shared/widgets/screen_scaffold.dart';

class AuthScreen extends StatelessWidget {
  const AuthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenScaffold(
      title: 'Local sign in',
      subtitle:
          'This Flutter MVP starts with a local session boundary. Backend auth will plug in behind this flow later.',
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const TextField(
            decoration: InputDecoration(labelText: 'Email'),
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 12),
          const TextField(
            decoration: InputDecoration(labelText: 'Password'),
            obscureText: true,
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () => context.go(AppRoutes.dashboard),
            child: const Text('Enter MoneyKai'),
          ),
        ],
      ),
    );
  }
}
