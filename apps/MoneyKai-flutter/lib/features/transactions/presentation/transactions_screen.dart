import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../routing/app_routes.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/screen_scaffold.dart';
import '../../../theme/app_tokens.dart';
import '../application/transaction_controller.dart';
import '../domain/money_transaction.dart';
import '../domain/transaction_type.dart';
import 'transaction_row.dart';

class TransactionsScreen extends ConsumerStatefulWidget {
  const TransactionsScreen({super.key});

  @override
  ConsumerState<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends ConsumerState<TransactionsScreen> {
  final _searchController = TextEditingController();
  TransactionType? _typeFilter;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final transactions = ref.watch(transactionControllerProvider);

    return ScreenScaffold(
      title: 'Transactions',
      subtitle:
          'Search, filter, and maintain the records that power budgets and insights.',
      body: transactions.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => EmptyState(
          title: 'Transactions unavailable',
          body: 'Local transaction data could not be loaded.',
          icon: Icons.error_outline,
          action: OutlinedButton(
            onPressed: () => ref.invalidate(transactionControllerProvider),
            child: const Text('Retry'),
          ),
        ),
        data: _buildTransactionList,
      ),
    );
  }

  Widget _buildTransactionList(List<MoneyTransaction> transactions) {
    final visible = _filterTransactions(transactions);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SearchBar(
          controller: _searchController,
          leading: const Icon(Icons.search),
          hintText: 'Search transactions',
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: AppSpacing.lg),
        SegmentedButton<TransactionType?>(
          segments: const [
            ButtonSegment(value: null, label: Text('All')),
            ButtonSegment(value: TransactionType.income, label: Text('Income')),
            ButtonSegment(
              value: TransactionType.expense,
              label: Text('Expense'),
            ),
          ],
          selected: {_typeFilter},
          onSelectionChanged: (selection) {
            setState(() => _typeFilter = selection.first);
          },
        ),
        const SizedBox(height: AppSpacing.xl),
        OutlinedButton.icon(
          onPressed: () => context.push(AppRoutes.addTransaction),
          icon: const Icon(Icons.add),
          label: const Text('Add transaction'),
        ),
        const SizedBox(height: AppSpacing.xl),
        if (transactions.isEmpty)
          const EmptyState(
            title: 'No local transactions yet',
            body: 'Add your first income or expense to start building reports.',
          )
        else if (visible.isEmpty)
          const EmptyState(
            title: 'No matching transactions',
            body: 'Try a different search or filter.',
            icon: Icons.search_off,
          )
        else
          ...visible.map(
            (transaction) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: TransactionRow(
                transaction: transaction,
                onEdit: () =>
                    context.push(AppRoutes.editTransactionPath(transaction.id)),
                onDelete: () => ref
                    .read(transactionControllerProvider.notifier)
                    .deleteTransaction(transaction.id),
              ),
            ),
          ),
      ],
    );
  }

  List<MoneyTransaction> _filterTransactions(
    List<MoneyTransaction> transactions,
  ) {
    final query = _searchController.text.trim().toLowerCase();

    return transactions.where((transaction) {
      final matchesType =
          _typeFilter == null || transaction.type == _typeFilter;
      final matchesQuery =
          query.isEmpty ||
          transaction.description.toLowerCase().contains(query) ||
          transaction.category.toLowerCase().contains(query) ||
          transaction.paymentMethod.toLowerCase().contains(query);

      return matchesType && matchesQuery;
    }).toList();
  }
}
