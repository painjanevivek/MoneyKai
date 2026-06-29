import 'transaction_type.dart';

class TransactionDraft {
  const TransactionDraft({
    required this.type,
    required this.amount,
    required this.date,
    required this.category,
    required this.paymentMethod,
    required this.description,
  });

  final TransactionType type;
  final double amount;
  final DateTime date;
  final String category;
  final String paymentMethod;
  final String description;
}
