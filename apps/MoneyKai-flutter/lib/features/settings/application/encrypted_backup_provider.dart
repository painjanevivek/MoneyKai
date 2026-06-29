import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/application/auth_controller.dart';
import '../../budget/application/budget_controller.dart';
import '../../transactions/application/transaction_controller.dart';
import '../../../core/storage/local_storage_provider.dart';
import 'local_data_export_provider.dart';
import '../data/encrypted_backup_restore_service.dart';
import '../data/encrypted_backup_service.dart';

final encryptedBackupServiceProvider = FutureProvider<EncryptedBackupService>((
  ref,
) async {
  final exportService = await ref.watch(localDataExportServiceProvider.future);

  return EncryptedBackupService(exportService: exportService);
});

final encryptedBackupRestoreServiceProvider =
    FutureProvider<EncryptedBackupRestoreService>((ref) async {
      final backupService = await ref.watch(
        encryptedBackupServiceProvider.future,
      );
      final storage = await ref.watch(localStorageServiceProvider.future);
      final authRepository = await ref.watch(
        localAuthRepositoryProvider.future,
      );
      final transactionRepository = await ref.watch(
        localTransactionRepositoryProvider.future,
      );
      final budgetRepository = await ref.watch(
        localBudgetRepositoryProvider.future,
      );

      return EncryptedBackupRestoreService(
        backupService: backupService,
        storage: storage,
        authRepository: authRepository,
        transactionRepository: transactionRepository,
        budgetRepository: budgetRepository,
      );
    });
