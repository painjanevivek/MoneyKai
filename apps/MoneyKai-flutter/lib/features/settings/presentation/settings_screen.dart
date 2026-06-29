import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:file_selector/file_selector.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/storage/local_storage_provider.dart';
import '../../../routing/app_routes.dart';
import '../../../shared/widgets/screen_scaffold.dart';
import '../../auth/application/auth_controller.dart';
import '../../budget/application/budget_controller.dart';
import '../application/encrypted_backup_provider.dart';
import '../application/local_data_export_provider.dart';
import '../application/theme_mode_controller.dart';
import '../../transactions/application/transaction_controller.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final selectedThemeMode =
        ref.watch(themeModeControllerProvider).value ?? ThemeMode.system;
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
            leading: const Icon(Icons.palette_outlined),
            title: const Text('Theme'),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 8),
              child: SegmentedButton<ThemeMode>(
                segments: const [
                  ButtonSegment(
                    value: ThemeMode.system,
                    label: Text('System'),
                    icon: Icon(Icons.devices_outlined),
                  ),
                  ButtonSegment(
                    value: ThemeMode.light,
                    label: Text('Light'),
                    icon: Icon(Icons.light_mode_outlined),
                  ),
                  ButtonSegment(
                    value: ThemeMode.dark,
                    label: Text('Dark'),
                    icon: Icon(Icons.dark_mode_outlined),
                  ),
                ],
                selected: {selectedThemeMode},
                onSelectionChanged: (selection) {
                  _setThemeMode(context, ref, selection.first);
                },
              ),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.file_download_outlined),
            title: const Text('Export local data'),
            subtitle: const Text('Copies local JSON to clipboard'),
            onTap: () => _exportLocalData(context, ref),
          ),
          ListTile(
            leading: const Icon(Icons.lock_outline),
            title: const Text('Create encrypted backup'),
            subtitle: const Text('Shares a password-protected JSON file'),
            onTap: () => _createEncryptedBackup(context, ref),
          ),
          ListTile(
            leading: const Icon(Icons.restore_outlined),
            title: const Text('Restore encrypted backup'),
            subtitle: const Text('Imports a password-protected JSON file'),
            onTap: () => _restoreEncryptedBackup(context, ref),
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

  Future<void> _setThemeMode(
    BuildContext context,
    WidgetRef ref,
    ThemeMode mode,
  ) async {
    await ref.read(themeModeControllerProvider.notifier).setThemeMode(mode);

    if (context.mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Theme set to ${mode.name}.')));
    }
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

  Future<void> _createEncryptedBackup(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final password = await _requestBackupPassword(context);
    if (password == null) {
      return;
    }

    try {
      final backupService = await ref.read(
        encryptedBackupServiceProvider.future,
      );
      final backup = await backupService.buildEncryptedBackup(
        password: password,
      );
      await SharePlus.instance.share(
        ShareParams(
          title: 'MoneyKai encrypted backup',
          text: 'MoneyKai encrypted backup. Keep the password separate.',
          files: [
            XFile.fromData(
              utf8.encode(backup.content),
              mimeType: 'application/json',
            ),
          ],
          fileNameOverrides: [backup.fileName],
        ),
      );

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Encrypted backup ready to share.')),
        );
      }
    } on FormatException catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not create encrypted backup.')),
        );
      }
    }
  }

  Future<void> _restoreEncryptedBackup(
    BuildContext context,
    WidgetRef ref,
  ) async {
    try {
      final file = await openFile(
        acceptedTypeGroups: const [
          XTypeGroup(
            label: 'MoneyKai backup',
            extensions: ['json'],
            mimeTypes: ['application/json'],
          ),
        ],
      );
      if (file == null) {
        return;
      }

      if (!context.mounted) {
        return;
      }
      final password = await _requestBackupPassword(
        context,
        title: 'Restore encrypted backup',
        actionLabel: 'Restore',
      );
      if (password == null) {
        return;
      }

      final backupJson = await file.readAsString();
      final restoreService = await ref.read(
        encryptedBackupRestoreServiceProvider.future,
      );
      final result = await restoreService.restoreEncryptedBackup(
        backupJson: backupJson,
        password: password,
      );

      ref.invalidate(authControllerProvider);
      ref.invalidate(transactionControllerProvider);
      ref.invalidate(budgetControllerProvider);

      if (context.mounted) {
        final messenger = ScaffoldMessenger.of(context);
        context.go(AppRoutes.dashboard);
        messenger.showSnackBar(
          SnackBar(
            content: Text(
              'Restored ${result.transactionCount} transactions for ${result.displayName}.',
            ),
          ),
        );
      }
    } on FormatException catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not restore encrypted backup.')),
        );
      }
    }
  }

  Future<String?> _requestBackupPassword(
    BuildContext context, {
    String title = 'Create encrypted backup',
    String actionLabel = 'Create',
  }) {
    var password = '';

    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          autofocus: true,
          obscureText: true,
          onChanged: (value) => password = value,
          decoration: const InputDecoration(
            labelText: 'Backup password',
            helperText: 'Use at least 8 characters.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(password),
            child: Text(actionLabel),
          ),
        ],
      ),
    );
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
