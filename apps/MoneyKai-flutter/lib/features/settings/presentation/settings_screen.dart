import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../routing/app_routes.dart';
import '../../../shared/widgets/screen_scaffold.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenScaffold(
      title: 'Settings',
      subtitle: 'Control local profile, privacy, and data boundaries.',
      body: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined),
            title: const Text('Privacy and security'),
            subtitle: const Text('Local-only MVP data boundary'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(AppRoutes.privacy),
          ),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Sign out'),
            onTap: () => context.go(AppRoutes.signIn),
          ),
        ],
      ),
    );
  }
}
