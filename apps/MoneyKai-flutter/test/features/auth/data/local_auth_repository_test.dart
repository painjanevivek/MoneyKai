import 'package:flutter_test/flutter_test.dart';
import 'package:moneykai/core/storage/local_storage_service.dart';
import 'package:moneykai/features/auth/data/local_auth_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('saves, restores, and clears a local auth session', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalAuthRepository(LocalStorageService(preferences));

    expect(repository.readSession().isAuthenticated, isFalse);

    final saved = await repository.saveSession(
      email: 'akshay@example.com',
      displayName: 'Akshay',
    );

    expect(saved.isAuthenticated, isTrue);
    expect(saved.user?.email, 'akshay@example.com');

    final restored = repository.readSession();
    expect(restored.user?.displayName, 'Akshay');

    final cleared = await repository.clearSession();
    expect(cleared.isAuthenticated, isFalse);
    expect(repository.readSession().isAuthenticated, isFalse);
  });

  test('returns signed-out state for malformed stored sessions', () async {
    SharedPreferences.setMockInitialValues({
      'moneykai.localSession': '{not-json',
    });
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalAuthRepository(LocalStorageService(preferences));

    expect(repository.readSession().isAuthenticated, isFalse);
  });

  test('trims local profile fields before saving', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalAuthRepository(LocalStorageService(preferences));

    final saved = await repository.saveSession(
      email: '  akshay@example.com  ',
      displayName: '  Akshay  ',
    );

    expect(saved.user?.email, 'akshay@example.com');
    expect(saved.user?.displayName, 'Akshay');
    expect(repository.readSession().user?.email, 'akshay@example.com');
  });

  test('rejects invalid local profile fields before saving', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalAuthRepository(LocalStorageService(preferences));

    expect(
      repository.saveSession(email: '@', displayName: 'Akshay'),
      throwsA(isA<FormatException>()),
    );
    expect(
      repository.saveSession(email: 'akshay@example.com', displayName: '   '),
      throwsA(isA<FormatException>()),
    );
    expect(repository.readSession().isAuthenticated, isFalse);
  });

  test('returns signed-out state for incomplete stored sessions', () async {
    SharedPreferences.setMockInitialValues({
      'moneykai.localSession': '{"email":"akshay@example.com"}',
    });
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalAuthRepository(LocalStorageService(preferences));

    expect(repository.readSession().isAuthenticated, isFalse);
  });

  test('returns signed-out state for invalid stored profile fields', () async {
    SharedPreferences.setMockInitialValues({
      'moneykai.localSession': '{"email":"@","displayName":"Akshay"}',
    });
    final preferences = await SharedPreferences.getInstance();
    final repository = LocalAuthRepository(LocalStorageService(preferences));

    expect(repository.readSession().isAuthenticated, isFalse);
  });
}
