class LocalUser {
  const LocalUser({required this.email, required this.displayName});

  final String email;
  final String displayName;

  Map<String, Object?> toJson() {
    return {'email': email, 'displayName': displayName};
  }

  static LocalUser fromJson(Map<String, Object?> json) {
    final email = json['email'];
    final displayName = json['displayName'];
    final trimmedEmail = email is String ? email.trim() : null;
    final trimmedDisplayName = displayName is String
        ? displayName.trim()
        : null;

    if (trimmedEmail == null ||
        trimmedDisplayName == null ||
        trimmedDisplayName.isEmpty ||
        !hasValidLocalEmailShape(trimmedEmail)) {
      throw const FormatException('Local user has invalid fields.');
    }

    return LocalUser(email: trimmedEmail, displayName: trimmedDisplayName);
  }
}

bool hasValidLocalEmailShape(String email) {
  final parts = email.split('@');
  return parts.length == 2 &&
      parts.first.isNotEmpty &&
      parts.last.isNotEmpty &&
      !email.contains(RegExp(r'\s'));
}
