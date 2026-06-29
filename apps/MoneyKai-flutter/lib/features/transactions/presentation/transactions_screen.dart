import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

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
  static const _allCategories = 'All categories';

  final _searchController = TextEditingController();
  final _monthFormatter = DateFormat('MMMM yyyy');
  TransactionType? _typeFilter;
  String _categoryFilter = _allCategories;

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
    final categories = _transactionCategories(transactions);
    final visible = _filterTransactions(transactions);
    final selectedCategory = categories.contains(_categoryFilter)
        ? _categoryFilter
        : _allCategories;

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
        Wrap(
          spacing: AppSpacing.md,
          runSpacing: AppSpacing.md,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            SegmentedButton<TransactionType?>(
              segments: const [
                ButtonSegment(value: null, label: Text('All')),
                ButtonSegment(
                  value: TransactionType.income,
                  label: Text('Income'),
                ),
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
            SizedBox(
              width: 220,
              child: DropdownButtonFormField<String>(
                isExpanded: true,
                initialValue: selectedCategory,
                decoration: const InputDecoration(labelText: 'Category'),
                items: [
                  const DropdownMenuItem(
                    value: _allCategories,
                    child: Text(_allCategories),
                  ),
                  for (final category in categories)
                    DropdownMenuItem(value: category, child: Text(category)),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _categoryFilter = value);
                  }
                },
              ),
            ),
          ],
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
          ..._buildGroupedTransactions(visible),
      ],
    );
  }

  List<Widget> _buildGroupedTransactions(List<MoneyTransaction> transactions) {
    final grouped = <String, List<MoneyTransaction>>{};
    for (final transaction in transactions) {
      final label = _monthFormatter.format(transaction.date);
      grouped.putIfAbsent(label, () => []).add(transaction);
    }

    return [
      for (final entry in grouped.entries) ...[
        Padding(
          padding: const EdgeInsets.only(
            top: AppSpacing.sm,
            bottom: AppSpacing.md,
          ),
          child: Text(entry.key, style: Theme.of(context).textTheme.titleSmall),
        ),
        for (final transaction in entry.value)
          Padding(
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
      ],
    ];
  }

  List<MoneyTransaction> _filterTransactions(
    List<MoneyTransaction> transactions,
  ) {
    final query = _searchController.text.trim().toLowerCase();
    final categoryFilter = _categoryFilter;

    return transactions.where((transaction) {
      final matchesType =
          _typeFilter == null || transaction.type == _typeFilter;
      final matchesCategory =
          categoryFilter == _allCategories ||
          transaction.category == categoryFilter;
      final matchesQuery =
          query.isEmpty ||
          transaction.description.toLowerCase().contains(query) ||
          transaction.category.toLowerCase().contains(query) ||
          transaction.paymentMethod.toLowerCase().contains(query);

      return matchesType && matchesCategory && matchesQuery;
    }).toList();
  }

  List<String> _transactionCategories(List<MoneyTransaction> transactions) {
    final categories = {
      for (final transaction in transactions) transaction.category,
    }.toList()..sort();
    return categories;
  }
}
