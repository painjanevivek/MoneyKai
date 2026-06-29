import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'local_data_export_provider.dart';
import '../data/encrypted_backup_service.dart';

final encryptedBackupServiceProvider = FutureProvider<EncryptedBackupService>((
  ref,
) async {
  final exportService = await ref.watch(localDataExportServiceProvider.future);

  return EncryptedBackupService(exportService: exportService);
});
