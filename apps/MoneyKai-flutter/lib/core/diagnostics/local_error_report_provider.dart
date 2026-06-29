import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/local_storage_provider.dart';
import 'local_error_report.dart';
import 'local_error_report_repository.dart';

final localErrorReportRepositoryProvider =
    FutureProvider<LocalErrorReportRepository>((ref) async {
      final storage = await ref.watch(localStorageServiceProvider.future);
      return LocalErrorReportRepository(storage);
    });

final localErrorReportsProvider = FutureProvider<List<LocalErrorReport>>((
  ref,
) async {
  final repository = await ref.watch(localErrorReportRepositoryProvider.future);
  return repository.readReports();
});
