class LocalErrorReport {
  const LocalErrorReport({
    required this.id,
    required this.source,
    required this.errorType,
    required this.message,
    required this.stackTrace,
    required this.occurredAt,
  });

  final String id;
  final String source;
  final String errorType;
  final String message;
  final String stackTrace;
  final DateTime occurredAt;

  Map<String, Object?> toJson() {
    return {
      'id': id,
      'source': source,
      'errorType': errorType,
      'message': message,
      'stackTrace': stackTrace,
      'occurredAt': occurredAt.toUtc().toIso8601String(),
    };
  }

  static LocalErrorReport? fromJson(Map<String, Object?> json) {
    final id = json['id'];
    final source = json['source'];
    final errorType = json['errorType'];
    final message = json['message'];
    final stackTrace = json['stackTrace'];
    final occurredAt = DateTime.tryParse('${json['occurredAt']}');
    final trimmedId = _trimmedText(id);
    final trimmedSource = _trimmedText(source);
    final trimmedErrorType = _trimmedText(errorType);

    if (trimmedId == null ||
        trimmedSource == null ||
        trimmedErrorType == null ||
        message is! String ||
        stackTrace is! String ||
        occurredAt == null) {
      return null;
    }

    return LocalErrorReport(
      id: trimmedId,
      source: trimmedSource,
      errorType: trimmedErrorType,
      message: message,
      stackTrace: stackTrace,
      occurredAt: occurredAt,
    );
  }
}

String? _trimmedText(Object? value) {
  if (value is! String) {
    return null;
  }

  final trimmed = value.trim();
  return trimmed.isEmpty ? null : trimmed;
}
