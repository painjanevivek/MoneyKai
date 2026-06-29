import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  LocalStorageService(this._preferences);

  final SharedPreferences _preferences;

  static const namespacePrefix = 'moneykai.';
  static const schemaVersionKey = 'moneykai.storageSchemaVersion';
  static const currentSchemaVersion = 1;

  static Future<LocalStorageService> create() async {
    final preferences = await SharedPreferences.getInstance();
    final service = LocalStorageService(preferences);
    await service.ensureInitialized();
    return service;
  }

  Future<void> ensureInitialized() async {
    final storedVersion = _preferences.getInt(schemaVersionKey) ?? 0;
    if (storedVersion >= currentSchemaVersion) {
      return;
    }

    await _preferences.setInt(schemaVersionKey, currentSchemaVersion);
  }

  String? readString(String key) => _preferences.getString(key);

  Future<void> writeString(String key, String value) {
    return _preferences.setString(key, value);
  }

  Future<void> remove(String key) => _preferences.remove(key);

  Future<void> resetNamespace() async {
    final moneyKaiKeys = _preferences.getKeys().where(
      (key) => key.startsWith(namespacePrefix),
    );

    for (final key in moneyKaiKeys.toList()) {
      await _preferences.remove(key);
    }

    await ensureInitialized();
  }
}
