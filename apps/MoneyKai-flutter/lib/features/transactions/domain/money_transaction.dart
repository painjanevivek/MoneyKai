import 'transaction_type.dart';

class MoneyTransaction {
  const MoneyTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.date,
    required this.category,
    required this.paymentMethod,
    required this.description,
  });

  final String id;
  final TransactionType type;
  final double amount;
  final DateTime date;
  final String category;
  final String paymentMethod;
  final String description;

  Map<String, Object?> toJson() {
    return {
      'id': id,
      'type': type.name,
      'amount': amount,
      'date': date.toIso8601String(),
      'category': category,
      'paymentMethod': paymentMethod,
      'description': description,
    };
  }

  static MoneyTransaction fromJson(Map<String, Object?> json) {
    final amount = (json['amount'] as num).toDouble();
    if (!amount.isFinite || amount <= 0) {
      throw const FormatException(
        'Transaction amount must be finite and greater than zero.',
      );
    }

    return MoneyTransaction(
      id: json['id'] as String,
      type: TransactionType.values.byName(json['type'] as String),
      amount: amount,
      date: DateTime.parse(json['date'] as String),
      category: json['category'] as String,
      paymentMethod: json['paymentMethod'] as String,
      description: json['description'] as String,
    );
  }
}
