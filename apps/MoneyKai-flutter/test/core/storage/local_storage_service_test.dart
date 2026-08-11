import 'package:flutter_test/flutter_test.dart';
import 'package:moneykai/core/storage/local_storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('initializes the current MoneyKai storage schema version', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final storage = LocalStorageService(preferences);

    await storage.ensureInitialized();

    expect(
      preferences.getInt(LocalStorageService.schemaVersionKey),
      LocalStorageService.currentSchemaVersion,
    );
  });

  test('preserves newer MoneyKai storage schema versions', () async {
    SharedPreferences.setMockInitialValues({
      LocalStorageService.schemaVersionKey:
          LocalStorageService.currentSchemaVersion + 1,
    });
    final preferences = await SharedPreferences.getInstance();
    final storage = LocalStorageService(preferences);

    await storage.ensureInitialized();

    expect(
      preferences.getInt(LocalStorageService.schemaVersionKey),
      LocalStorageService.currentSchemaVersion + 1,
    );
  });

  test('rejects storage access outside the MoneyKai namespace', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final storage = LocalStorageService(preferences);

    expect(
      () => storage.readString('other.product.setting'),
      throwsArgumentError,
    );
    expect(
      () => storage.writeString('other.product.setting', 'value'),
      throwsArgumentError,
    );
    expect(() => storage.remove('other.product.setting'), throwsArgumentError);
  });

  test(
    'resets only the MoneyKai namespace and restores schema metadata',
    () async {
      SharedPreferences.setMockInitialValues({});
      final preferences = await SharedPreferences.getInstance();
      await preferences.setString(
        'moneykai.localSession',
        '{"email":"a@b.test"}',
      );
      await preferences.setString('moneykai.transactions', '[]');
      await preferences.setString('other.product.setting', 'keep');
      final storage = LocalStorageService(preferences);

      await storage.resetNamespace();

      expect(preferences.getString('moneykai.localSession'), isNull);
      expect(preferences.getString('moneykai.transactions'), isNull);
      expect(preferences.getString('other.product.setting'), 'keep');
      expect(
        preferences.getInt(LocalStorageService.schemaVersionKey),
        LocalStorageService.currentSchemaVersion,
      );
    },
  );

  test('staged namespaces are invisible until one atomic activation', () async {
    SharedPreferences.setMockInitialValues({
      'moneykai.localSession': 'original',
    });
    final preferences = await SharedPreferences.getInstance();
    final storage = LocalStorageService(preferences);
    final staged = storage.createStagingNamespace(namespaceId: 'restore-1');

    await staged.writeString('moneykai.localSession', 'replacement');

    expect(storage.readString('moneykai.localSession'), 'original');
    await storage.activateStagedNamespace(staged);
    expect(storage.readString('moneykai.localSession'), 'replacement');
  });

  test('discarding a failed staged restore preserves active data', () async {
    SharedPreferences.setMockInitialValues({
      'moneykai.localSession': 'original',
    });
    final preferences = await SharedPreferences.getInstance();
    final storage = LocalStorageService(preferences);
    final staged = storage.createStagingNamespace(namespaceId: 'restore-2');

    await staged.writeString('moneykai.localSession', 'partial');
    await storage.discardStagedNamespace(staged);

    expect(storage.readString('moneykai.localSession'), 'original');
    expect(
      preferences.getString(LocalStorageService.activeNamespaceKey),
      isNull,
    );
  });
}
