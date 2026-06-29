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
      'id': _requiredText(id, fieldName: 'Transaction id'),
      'type': type.name,
      'amount': amount,
      'date': date.toIso8601String(),
      'category': _requiredText(category, fieldName: 'Transaction category'),
      'paymentMethod': _requiredText(
        paymentMethod,
        fieldName: 'Transaction payment method',
      ),
      'description': _requiredText(
        description,
        fieldName: 'Transaction description',
      ),
    };
  }

  static MoneyTransaction fromJson(Map<String, Object?> json) {
    final amountValue = json['amount'];
    if (amountValue is! num) {
      throw const FormatException('Transaction amount is invalid.');
    }

    final amount = amountValue.toDouble();
    if (!amount.isFinite || amount <= 0) {
      throw const FormatException(
        'Transaction amount must be finite and greater than zero.',
      );
    }

    return MoneyTransaction(
      id: _requiredText(json['id'], fieldName: 'Transaction id'),
      type: TransactionType.values.byName(
        _requiredText(json['type'], fieldName: 'Transaction type'),
      ),
      amount: amount,
      date: DateTime.parse(
        _requiredText(json['date'], fieldName: 'Transaction date'),
      ),
      category: _requiredText(
        json['category'],
        fieldName: 'Transaction category',
      ),
      paymentMethod: _requiredText(
        json['paymentMethod'],
        fieldName: 'Transaction payment method',
      ),
      description: _requiredText(
        json['description'],
        fieldName: 'Transaction description',
      ),
    );
  }
}

String _requiredText(Object? value, {required String fieldName}) {
  if (value is! String) {
    throw FormatException('$fieldName is invalid.');
  }

  final trimmed = value.trim();
  if (trimmed.isEmpty) {
    throw FormatException('$fieldName is required.');
  }

  return trimmed;
}
