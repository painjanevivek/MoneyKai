import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/application/auth_controller.dart';
import '../../budget/application/budget_controller.dart';
import '../../transactions/application/transaction_controller.dart';
import '../data/local_data_export_service.dart';

final localDataExportServiceProvider = FutureProvider<LocalDataExportService>((
  ref,
) async {
  final authRepository = await ref.watch(localAuthRepositoryProvider.future);
  final transactionRepository = await ref.watch(
    localTransactionRepositoryProvider.future,
  );
  final budgetRepository = await ref.watch(
    localBudgetRepositoryProvider.future,
  );

  return LocalDataExportService(
    authRepository: authRepository,
    transactionRepository: transactionRepository,
    budgetRepository: budgetRepository,
  );
});
