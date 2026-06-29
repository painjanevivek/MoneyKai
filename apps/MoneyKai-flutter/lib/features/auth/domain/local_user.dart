class LocalUser {
  const LocalUser({required this.email, required this.displayName});

  final String email;
  final String displayName;

  Map<String, Object?> toJson() {
    return {'email': email, 'displayName': displayName};
  }

  static LocalUser fromJson(Map<String, Object?> json) {
    return LocalUser(
      email: json['email'] as String,
      displayName: json['displayName'] as String,
    );
  }
}
