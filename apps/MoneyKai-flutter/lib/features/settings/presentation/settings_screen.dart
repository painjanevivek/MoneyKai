import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../core/storage/local_storage_provider.dart';
import '../../../routing/app_routes.dart';
import '../../../shared/widgets/screen_scaffold.dart';
import '../../auth/application/auth_controller.dart';
import '../../budget/application/budget_controller.dart';
import '../application/local_data_export_provider.dart';
import '../../transactions/application/transaction_controller.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final user = authState.asData?.value.user;

    return ScreenScaffold(
      title: 'Settings',
      subtitle: 'Control local profile, privacy, and data boundaries.',
      body: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: Text(user?.displayName ?? 'Local user'),
            subtitle: Text(user?.email ?? 'No local profile loaded'),
          ),
          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined),
            title: const Text('Privacy and security'),
            subtitle: const Text('Local-only MVP data boundary'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push(AppRoutes.privacy),
          ),
          ListTile(
            leading: const Icon(Icons.file_download_outlined),
            title: const Text('Export local data'),
            subtitle: const Text('Copies local JSON to clipboard'),
            onTap: () => _exportLocalData(context, ref),
          ),
          ListTile(
            leading: Icon(
              Icons.delete_forever_outlined,
              color: Theme.of(context).colorScheme.error,
            ),
            title: const Text('Reset local data'),
            subtitle: const Text(
              'Clears local profile, transactions, and budget data',
            ),
            onTap: () => _confirmReset(context, ref),
          ),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Sign out'),
            onTap: () async {
              await ref.read(authControllerProvider.notifier).signOut();
              if (context.mounted) {
                context.go(AppRoutes.signIn);
              }
            },
          ),
        ],
      ),
    );
  }

  Future<void> _exportLocalData(BuildContext context, WidgetRef ref) async {
    try {
      final exporter = await ref.read(localDataExportServiceProvider.future);
      final exportJson = exporter.buildExportJson();
      await Clipboard.setData(ClipboardData(text: exportJson));

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Local data copied to clipboard.')),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not export local data.')),
        );
      }
    }
  }

  Future<void> _confirmReset(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset local data?'),
        content: const Text(
          'This clears MoneyKai data on this device, including the local profile, transactions, and budget settings.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Reset'),
          ),
        ],
      ),
    );

    if (confirmed != true) {
      return;
    }

    final storage = await ref.read(localStorageServiceProvider.future);
    await storage.resetNamespace();
    await ref.read(authControllerProvider.notifier).signOut();
    ref.invalidate(transactionControllerProvider);
    ref.invalidate(budgetControllerProvider);

    if (context.mounted) {
      final messenger = ScaffoldMessenger.of(context);
      context.go(AppRoutes.signIn);
      messenger.showSnackBar(
        const SnackBar(content: Text('Local MoneyKai data reset.')),
      );
    }
  }
}
