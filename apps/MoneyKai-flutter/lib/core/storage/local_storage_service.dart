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

  String? readString(String key) {
    _assertMoneyKaiKey(key);
    return _preferences.getString(key);
  }

  Future<void> writeString(String key, String value) {
    _assertMoneyKaiKey(key);
    return _preferences.setString(key, value);
  }

  Future<void> remove(String key) {
    _assertMoneyKaiKey(key);
    return _preferences.remove(key);
  }

  Future<void> resetNamespace() async {
    final moneyKaiKeys = _preferences.getKeys().where(
      (key) => key.startsWith(namespacePrefix),
    );

    for (final key in moneyKaiKeys.toList()) {
      await _preferences.remove(key);
    }

    await ensureInitialized();
  }

  static void _assertMoneyKaiKey(String key) {
    if (!key.startsWith(namespacePrefix)) {
      throw ArgumentError.value(
        key,
        'key',
        'MoneyKai local storage keys must start with $namespacePrefix',
      );
    }
  }
}
