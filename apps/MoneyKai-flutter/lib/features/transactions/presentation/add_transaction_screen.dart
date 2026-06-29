import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../shared/widgets/screen_scaffold.dart';
import '../../../theme/app_tokens.dart';
import '../application/transaction_controller.dart';
import '../domain/transaction_draft.dart';
import '../domain/transaction_type.dart';

class AddTransactionScreen extends ConsumerStatefulWidget {
  const AddTransactionScreen({super.key});

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

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final transactions = ref.watch(transactionControllerProvider);

    return ScreenScaffold(
      title: 'Add transaction',
      subtitle:
          'Record local income and expenses. Saved records update the transaction list immediately.',
      actions: [
        IconButton(
          tooltip: 'Close',
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.close),
        ),
      ],
      body: Column(
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
                    for (final category in _categories)
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
                  decoration: const InputDecoration(
                    labelText: 'Payment method',
                  ),
                  items: [
                    for (final method in _paymentMethods)
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
            onPressed: transactions.isLoading ? null : _save,
            child: transactions.isLoading
                ? const Text('Saving...')
                : const Text('Save transaction'),
          ),
        ],
      ),
    );
  }

  String? _amountValidator(String? value) {
    final amount = double.tryParse(value ?? '');
    if (amount == null) {
      return 'Enter a valid amount';
    }
    return amount > 0 ? null : 'Amount must be greater than zero';
  }

  Future<void> _pickDate() async {
    final selected = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (selected != null) {
      setState(() => _date = selected);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    await ref
        .read(transactionControllerProvider.notifier)
        .addTransaction(
          TransactionDraft(
            type: _type,
            amount: double.parse(_amountController.text),
            date: _date,
            category: _category,
            paymentMethod: _paymentMethod,
            description: _descriptionController.text.trim(),
          ),
        );

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

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Transaction saved.')));
    Navigator.of(context).pop();
  }
}
