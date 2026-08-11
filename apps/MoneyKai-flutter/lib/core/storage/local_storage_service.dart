import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  LocalStorageService(this._preferences, {String? namespaceId})
    : _namespaceId = namespaceId {
    if (namespaceId != null && !_isValidNamespaceId(namespaceId)) {
      throw ArgumentError.value(namespaceId, 'namespaceId');
    }
  }

  final SharedPreferences _preferences;
  final String? _namespaceId;

  static const namespacePrefix = 'moneykai.';
  static const schemaVersionKey = 'moneykai.storageSchemaVersion';
  static const activeNamespaceKey = 'moneykai.activeNamespace';
  static const currentSchemaVersion = 1;
  static const _versionedNamespacePrefix = 'moneykai.namespace.';
  static const _completionMarker = '__complete';
  static int _stagingSequence = 0;

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
    return _preferences.getString(_resolveKey(key));
  }

  Future<void> writeString(String key, String value) async {
    _assertMoneyKaiKey(key);
    final written = await _preferences.setString(_resolveKey(key), value);
    if (!written) {
      throw StateError('Could not persist MoneyKai local data.');
    }
  }

  Future<void> remove(String key) {
    _assertMoneyKaiKey(key);
    return _preferences.remove(_resolveKey(key));
  }

  LocalStorageService createStagingNamespace({String? namespaceId}) {
    final resolvedId = namespaceId ?? _nextNamespaceId();
    return LocalStorageService(_preferences, namespaceId: resolvedId);
  }

  Future<void> activateStagedNamespace(LocalStorageService staged) async {
    final namespaceId = staged._namespaceId;
    if (!identical(staged._preferences, _preferences) || namespaceId == null) {
      throw ArgumentError('Staged storage must belong to this MoneyKai store.');
    }

    final completionKey =
        '${_physicalNamespacePrefix(namespaceId)}$_completionMarker';
    final markerWritten = await _preferences.setString(completionKey, '1');
    if (!markerWritten || _preferences.getString(completionKey) != '1') {
      throw StateError('Could not verify restored MoneyKai data.');
    }

    final previousNamespaceId = _preferences.getString(activeNamespaceKey);
    final written = await _preferences.setString(
      activeNamespaceKey,
      namespaceId,
    );
    if (!written) {
      throw StateError('Could not activate restored MoneyKai data.');
    }

    try {
      await _removeInactiveNamespaceData(
        namespaceId,
        previousNamespaceId: previousNamespaceId,
      );
    } catch (_) {
      // The active pointer is already durable. Old inactive data can be
      // cleaned during a later restore or reset without affecting correctness.
    }
  }

  Future<void> discardStagedNamespace(LocalStorageService staged) async {
    final namespaceId = staged._namespaceId;
    if (!identical(staged._preferences, _preferences) || namespaceId == null) {
      throw ArgumentError('Staged storage must belong to this MoneyKai store.');
    }
    if (_preferences.getString(activeNamespaceKey) == namespaceId) {
      throw StateError('Cannot discard the active MoneyKai namespace.');
    }

    final prefix = _physicalNamespacePrefix(namespaceId);
    final stagedKeys = _preferences.getKeys().where(
      (key) => key.startsWith(prefix),
    );
    for (final key in stagedKeys.toList()) {
      await _preferences.remove(key);
    }
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

  String _resolveKey(String key) {
    if (key == schemaVersionKey || key == activeNamespaceKey) {
      return key;
    }

    final namespaceId =
        _namespaceId ?? _preferences.getString(activeNamespaceKey);
    if (namespaceId == null) {
      return key;
    }

    return '${_physicalNamespacePrefix(namespaceId)}${key.substring(namespacePrefix.length)}';
  }

  Future<void> _removeInactiveNamespaceData(
    String activeNamespaceId, {
    required String? previousNamespaceId,
  }) async {
    final activePrefix = _physicalNamespacePrefix(activeNamespaceId);
    final previousPrefix = previousNamespaceId == null
        ? null
        : _physicalNamespacePrefix(previousNamespaceId);
    final inactiveKeys = _preferences.getKeys().where((key) {
      if (!key.startsWith(namespacePrefix) ||
          key == schemaVersionKey ||
          key == activeNamespaceKey) {
        return false;
      }
      if (key.startsWith(activePrefix) ||
          (previousPrefix != null && key.startsWith(previousPrefix))) {
        return false;
      }
      if (previousNamespaceId == null &&
          !key.startsWith(_versionedNamespacePrefix)) {
        return false;
      }
      return true;
    });

    for (final key in inactiveKeys.toList()) {
      await _preferences.remove(key);
    }
  }

  static String _physicalNamespacePrefix(String namespaceId) =>
      '$_versionedNamespacePrefix$namespaceId.';

  static String _nextNamespaceId() {
    _stagingSequence += 1;
    final timestamp = DateTime.now().microsecondsSinceEpoch.toRadixString(36);
    return '$timestamp-${_stagingSequence.toRadixString(36)}';
  }

  static bool _isValidNamespaceId(String value) =>
      RegExp(r'^[A-Za-z0-9_-]{1,64}$').hasMatch(value);

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
