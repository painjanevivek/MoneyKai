import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/screen_scaffold.dart';
import '../../../theme/app_tokens.dart';
import '../application/transaction_controller.dart';
import '../domain/money_transaction.dart';
import '../domain/transaction_draft.dart';
import '../domain/transaction_type.dart';

class AddTransactionScreen extends ConsumerStatefulWidget {
  const AddTransactionScreen({this.transactionId, super.key});

  final String? transactionId;

  @override
  ConsumerState<AddTransactionScreen> createState() =>
      _AddTransactionScreenState();
}

class _AddTransactionScreenState extends ConsumerState<AddTransactionScreen> {
  static const _categories = [
    'Food',
    'Transport',
    'Bills',
    'Shopping',
    'Health',
    'Salary',
    'Freelance',
    'Other',
  ];

  static const _paymentMethods = ['UPI', 'Card', 'Cash', 'Bank transfer'];

  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _dateFormatter = DateFormat('dd MMM yyyy');

  TransactionType _type = TransactionType.expense;
  DateTime _date = DateTime.now();
  String _category = _categories.first;
  String _paymentMethod = _paymentMethods.first;
  bool _didPrepareEditForm = false;

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final transactions = ref.watch(transactionControllerProvider);
    final isEditing = widget.transactionId != null;

    return ScreenScaffold(
      title: isEditing ? 'Edit transaction' : 'Add transaction',
      subtitle: isEditing
          ? 'Update a local record and keep budgets and insights in sync.'
          : 'Record local income and expenses. Saved records update the transaction list immediately.',
      actions: [
        IconButton(
          tooltip: 'Close',
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.close),
        ),
      ],
      body: isEditing
          ? transactions.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stackTrace) => EmptyState(
                title: 'Transaction unavailable',
                body: 'This local transaction could not be loaded.',
                icon: Icons.error_outline,
                action: OutlinedButton(
                  onPressed: () =>
                      ref.invalidate(transactionControllerProvider),
                  child: const Text('Retry'),
                ),
              ),
              data: (items) {
                final transaction = _findTransaction(items);
                if (transaction == null) {
                  return EmptyState(
                    title: 'Transaction not found',
                    body:
                        'This local record may have been deleted on this device.',
                    icon: Icons.search_off,
                    action: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Back to transactions'),
                    ),
                  );
                }

                _prepareEditForm(transaction);
                return _buildForm(transactions.isLoading);
              },
            )
          : _buildForm(transactions.isLoading),
    );
  }

  Widget _buildForm(bool isSaving) {
    final isEditing = widget.transactionId != null;
    final categories = _optionList(_categories, _category);
    final paymentMethods = _optionList(_paymentMethods, _paymentMethod);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SegmentedButton<TransactionType>(
          segments: const [
            ButtonSegment(
              value: TransactionType.expense,
              label: Text('Expense'),
              icon: Icon(Icons.arrow_upward),
            ),
            ButtonSegment(
              value: TransactionType.income,
              label: Text('Income'),
              icon: Icon(Icons.arrow_downward),
            ),
          ],
          selected: {_type},
          onSelectionChanged: (selection) {
            setState(() {
              _type = selection.first;
              _category = _type == TransactionType.income
                  ? 'Salary'
                  : _categories.first;
            });
          },
        ),
        const SizedBox(height: AppSpacing.xl),
        Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(labelText: 'Amount'),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                validator: _amountValidator,
              ),
              const SizedBox(height: AppSpacing.md),
              DropdownButtonFormField<String>(
                initialValue: _category,
                decoration: const InputDecoration(labelText: 'Category'),
                items: [
                  for (final category in categories)
                    DropdownMenuItem(value: category, child: Text(category)),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _category = value);
                  }
                },
              ),
              const SizedBox(height: AppSpacing.md),
              DropdownButtonFormField<String>(
                initialValue: _paymentMethod,
                decoration: const InputDecoration(labelText: 'Payment method'),
                items: [
                  for (final method in paymentMethods)
                    DropdownMenuItem(value: method, child: Text(method)),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _paymentMethod = value);
                  }
                },
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Description'),
                textInputAction: TextInputAction.done,
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Description is required'
                    : null,
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        OutlinedButton.icon(
          onPressed: _pickDate,
          icon: const Icon(Icons.calendar_today_outlined),
          label: Text(_dateFormatter.format(_date)),
        ),
        const SizedBox(height: AppSpacing.xl),
        FilledButton(
          onPressed: isSaving ? null : _save,
          child: isSaving
              ? const Text('Saving...')
              : Text(isEditing ? 'Update transaction' : 'Save transaction'),
        ),
      ],
    );
  }

  List<String> _optionList(List<String> defaults, String selected) {
    if (defaults.contains(selected)) {
      return defaults;
    }

    return [selected, ...defaults];
  }

  MoneyTransaction? _findTransaction(List<MoneyTransaction> transactions) {
    for (final transaction in transactions) {
      if (transaction.id == widget.transactionId) {
        return transaction;
      }
    }

    return null;
  }

  void _prepareEditForm(MoneyTransaction transaction) {
    if (_didPrepareEditForm) {
      return;
    }

    _type = transaction.type;
    _date = transaction.date;
    _category = transaction.category;
    _paymentMethod = transaction.paymentMethod;
    _amountController.text = transaction.amount.toStringAsFixed(
      transaction.amount.truncateToDouble() == transaction.amount ? 0 : 2,
    );
    _descriptionController.text = transaction.description;
    _didPrepareEditForm = true;
  }

  String? _amountValidator(String? value) {
    final amount = double.tryParse(value ?? '');
    if (amount == null || !amount.isFinite) {
      return 'Enter a valid amount';
    }
    return amount > 0 ? null : 'Amount must be greater than zero';
  }

  Future<void> _pickDate() async {
    final defaultFirstDate = DateTime(2020);
    final defaultLastDate = DateTime.now().add(const Duration(days: 365));
    final firstDate = _date.isBefore(defaultFirstDate)
        ? DateTime(_date.year, _date.month, _date.day)
        : defaultFirstDate;
    final lastDate = _date.isAfter(defaultLastDate)
        ? DateTime(_date.year, _date.month, _date.day)
        : defaultLastDate;
    final selected = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: firstDate,
      lastDate: lastDate,
    );

    if (selected != null) {
      setState(() => _date = selected);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final draft = TransactionDraft(
      type: _type,
      amount: double.parse(_amountController.text.trim()),
      date: _date,
      category: _category,
      paymentMethod: _paymentMethod,
      description: _descriptionController.text.trim(),
    );
    final controller = ref.read(transactionControllerProvider.notifier);
    if (widget.transactionId == null) {
      await controller.addTransaction(draft);
    } else {
      await controller.updateTransaction(widget.transactionId!, draft);
    }

    if (!mounted) {
      return;
    }

    final state = ref.read(transactionControllerProvider);
    if (state.hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not save transaction.')),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          widget.transactionId == null
              ? 'Transaction saved.'
              : 'Transaction updated.',
        ),
      ),
    );
    Navigator.of(context).pop();
  }
}
