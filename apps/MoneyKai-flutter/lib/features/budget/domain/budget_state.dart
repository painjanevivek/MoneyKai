class BudgetState {
  const BudgetState({required this.monthlyLimit, required this.categoryLimits});

  static const defaultCategoryLimits = {
    'Food': 8000.0,
    'Transport': 4000.0,
    'Bills': 9000.0,
    'Shopping': 4000.0,
    'Health': 3000.0,
    'Other': 3000.0,
  };

  factory BudgetState.initial() {
    return const BudgetState(
      monthlyLimit: 25000,
      categoryLimits: defaultCategoryLimits,
    );
  }

  final double monthlyLimit;
  final Map<String, double> categoryLimits;

  BudgetState copyWith({
    double? monthlyLimit,
    Map<String, double>? categoryLimits,
  }) {
    return BudgetState(
      monthlyLimit: monthlyLimit ?? this.monthlyLimit,
      categoryLimits: categoryLimits ?? this.categoryLimits,
    );
  }

  Map<String, Object?> toJson() {
    return {'monthlyLimit': monthlyLimit, 'categoryLimits': categoryLimits};
  }

  static BudgetState fromJson(Map<String, Object?> json) {
    final rawCategoryLimits = json['categoryLimits'];
    final categoryLimits = rawCategoryLimits is Map
        ? rawCategoryLimits.map(
            (key, value) => MapEntry(key.toString(), (value as num).toDouble()),
          )
        : defaultCategoryLimits;
    final monthlyLimit = (json['monthlyLimit'] as num?)?.toDouble() ?? 25000;

    if (!monthlyLimit.isFinite || monthlyLimit <= 0) {
      throw const FormatException(
        'Monthly budget limit must be finite and greater than zero.',
      );
    }

    for (final limit in categoryLimits.values) {
      if (!limit.isFinite || limit <= 0) {
        throw const FormatException(
          'Category budget limits must be finite and greater than zero.',
        );
      }
    }

    return BudgetState(
      monthlyLimit: monthlyLimit,
      categoryLimits: categoryLimits,
    );
  }
}
