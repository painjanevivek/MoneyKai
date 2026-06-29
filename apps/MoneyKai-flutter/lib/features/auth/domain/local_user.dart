class LocalUser {
  const LocalUser({required this.email, required this.displayName});

  final String email;
  final String displayName;

  Map<String, Object?> toJson() {
    return {
      'email': _requiredLocalEmail(email),
      'displayName': _requiredDisplayName(displayName),
    };
  }

  static LocalUser fromJson(Map<String, Object?> json) {
    final email = json['email'];
    final displayName = json['displayName'];
    try {
      return LocalUser(
        email: _requiredLocalEmail(email),
        displayName: _requiredDisplayName(displayName),
      );
    } catch (_) {
      throw const FormatException('Local user has invalid fields.');
    }
  }
}

String _requiredLocalEmail(Object? value) {
  if (value is! String) {
    throw const FormatException('Local user email is invalid.');
  }

  final trimmed = value.trim();
  if (!hasValidLocalEmailShape(trimmed)) {
    throw const FormatException('Local user email is invalid.');
  }

  return trimmed;
}

String _requiredDisplayName(Object? value) {
  if (value is! String) {
    throw const FormatException('Local user display name is invalid.');
  }

  final trimmed = value.trim();
  if (trimmed.isEmpty) {
    throw const FormatException('Local user display name is required.');
  }

  return trimmed;
}

bool hasValidLocalEmailShape(String email) {
  final parts = email.split('@');
  return parts.length == 2 &&
      parts.first.isNotEmpty &&
      parts.last.isNotEmpty &&
      !email.contains(RegExp(r'\s'));
}
