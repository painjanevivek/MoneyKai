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
    return {
      'monthlyLimit': _requiredPositiveFiniteLimit(
        monthlyLimit,
        fieldName: 'Monthly budget limit',
      ),
      'categoryLimits': {
        for (final entry in categoryLimits.entries)
          _requiredCategoryName(entry.key): _requiredPositiveFiniteLimit(
            entry.value,
            fieldName: 'Category budget limit',
          ),
      },
    };
  }

  static BudgetState fromJson(Map<String, Object?> json) {
    final rawCategoryLimits = json['categoryLimits'];
    final categoryLimits = rawCategoryLimits is Map
        ? _categoryLimitsFromJson(rawCategoryLimits)
        : defaultCategoryLimits;
    final monthlyLimit = (json['monthlyLimit'] as num?)?.toDouble() ?? 25000;

    _requiredPositiveFiniteLimit(
      monthlyLimit,
      fieldName: 'Monthly budget limit',
    );

    for (final limit in categoryLimits.values) {
      _requiredPositiveFiniteLimit(limit, fieldName: 'Category budget limit');
    }

    return BudgetState(
      monthlyLimit: monthlyLimit,
      categoryLimits: categoryLimits,
    );
  }
}

Map<String, double> _categoryLimitsFromJson(Map<Object?, Object?> json) {
  final categoryLimits = <String, double>{};

  for (final entry in json.entries) {
    final value = entry.value;
    if (value is! num) {
      throw const FormatException('Category budget limit is invalid.');
    }

    categoryLimits[_requiredCategoryName(
      entry.key,
    )] = _requiredPositiveFiniteLimit(
      value.toDouble(),
      fieldName: 'Category budget limit',
    );
  }

  return categoryLimits;
}

double _requiredPositiveFiniteLimit(double value, {required String fieldName}) {
  if (!value.isFinite || value <= 0) {
    throw FormatException('$fieldName must be finite and greater than zero.');
  }

  return value;
}

String _requiredCategoryName(Object? value) {
  if (value is! String) {
    throw const FormatException('Budget category name is invalid.');
  }

  final trimmed = value.trim();
  if (trimmed.isEmpty) {
    throw const FormatException('Budget category name is required.');
  }

  return trimmed;
}
