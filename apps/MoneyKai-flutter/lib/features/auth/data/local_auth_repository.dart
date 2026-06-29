import 'dart:convert';

import '../../../core/storage/local_storage_service.dart';
import '../domain/auth_session_state.dart';
import '../domain/local_user.dart';

class LocalAuthRepository {
  LocalAuthRepository(this._storage);

  static const _sessionKey = 'moneykai.localSession';

  final LocalStorageService _storage;

  AuthSessionState readSession() {
    final rawSession = _storage.readString(_sessionKey);
    if (rawSession == null) {
      return const AuthSessionState();
    }

    try {
      final decoded = jsonDecode(rawSession);
      if (decoded is! Map<String, Object?>) {
        return const AuthSessionState();
      }

      return AuthSessionState(user: LocalUser.fromJson(decoded));
    } catch (_) {
      return const AuthSessionState();
    }
  }

  Future<AuthSessionState> saveSession({
    required String email,
    required String displayName,
  }) async {
    final user = LocalUser(email: email, displayName: displayName);
    await _storage.writeString(_sessionKey, jsonEncode(user.toJson()));
    return AuthSessionState(user: user);
  }

  Future<AuthSessionState> clearSession() async {
    await _storage.remove(_sessionKey);
    return const AuthSessionState();
  }
}
