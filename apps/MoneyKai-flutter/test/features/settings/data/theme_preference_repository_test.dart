import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:moneykai/core/storage/local_storage_service.dart';
import 'package:moneykai/features/settings/data/theme_preference_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('reads system theme mode by default', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = ThemePreferenceRepository(
      LocalStorageService(preferences),
    );

    expect(repository.readThemeMode(), ThemeMode.system);
  });

  test('saves and restores selected theme mode', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final repository = ThemePreferenceRepository(
      LocalStorageService(preferences),
    );

    await repository.saveThemeMode(ThemeMode.dark);

    expect(repository.readThemeMode(), ThemeMode.dark);
    expect(
      preferences.getString(ThemePreferenceRepository.themeModeKey),
      'dark',
    );
  });

  test('trims stored theme mode before restoring', () async {
    SharedPreferences.setMockInitialValues({
      ThemePreferenceRepository.themeModeKey: ' dark ',
    });
    final preferences = await SharedPreferences.getInstance();
    final repository = ThemePreferenceRepository(
      LocalStorageService(preferences),
    );

    expect(repository.readThemeMode(), ThemeMode.dark);
  });

  test('returns system theme mode for unsupported stored values', () async {
    SharedPreferences.setMockInitialValues({
      ThemePreferenceRepository.themeModeKey: 'blue',
    });
    final preferences = await SharedPreferences.getInstance();
    final repository = ThemePreferenceRepository(
      LocalStorageService(preferences),
    );

    expect(repository.readThemeMode(), ThemeMode.system);
  });
}
