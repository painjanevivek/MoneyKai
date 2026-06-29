import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_storage_provider.dart';
import '../data/local_transaction_repository.dart';
import '../domain/money_transaction.dart';
import '../domain/transaction_draft.dart';

final localTransactionRepositoryProvider =
    FutureProvider<LocalTransactionRepository>((ref) async {
      final storage = await ref.watch(localStorageServiceProvider.future);
      return LocalTransactionRepository(storage);
    });

final transactionControllerProvider =
    AsyncNotifierProvider<TransactionController, List<MoneyTransaction>>(
      TransactionController.new,
    );

class TransactionController extends AsyncNotifier<List<MoneyTransaction>> {
  @override
  Future<List<MoneyTransaction>> build() async {
    final repository = await ref.watch(
      localTransactionRepositoryProvider.future,
    );
    return repository.readTransactions();
  }

  Future<void> addTransaction(TransactionDraft draft) async {
    state = await AsyncValue.guard(() async {
      final repository = await ref.read(
        localTransactionRepositoryProvider.future,
      );
      final current = state.asData?.value ?? repository.readTransactions();
      final transaction = MoneyTransaction(
        id: DateTime.now().microsecondsSinceEpoch.toString(),
        type: draft.type,
        amount: draft.amount,
        date: draft.date,
        category: draft.category,
        paymentMethod: draft.paymentMethod,
        description: draft.description,
      );
      final next = [transaction, ...current]
        ..sort((a, b) => b.date.compareTo(a.date));

      await repository.saveTransactions(next);
      return next;
    });
  }

  Future<void> deleteTransaction(String id) async {
    state = await AsyncValue.guard(() async {
      final repository = await ref.read(
        localTransactionRepositoryProvider.future,
      );
      final current = state.asData?.value ?? repository.readTransactions();
      final next = current
          .where((transaction) => transaction.id != id)
          .toList();

      await repository.saveTransactions(next);
      return next;
    });
  }
}
