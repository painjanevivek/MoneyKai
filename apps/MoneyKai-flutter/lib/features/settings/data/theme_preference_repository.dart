import 'package:flutter/material.dart';

import '../../../core/storage/local_storage_service.dart';

class ThemePreferenceRepository {
  ThemePreferenceRepository(this._storage);

  static const themeModeKey = 'moneykai.themeMode';

  final LocalStorageService _storage;

  ThemeMode readThemeMode() {
    final stored = _storage.readString(themeModeKey)?.trim();
    return switch (stored) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
  }

  Future<void> saveThemeMode(ThemeMode mode) {
    return _storage.writeString(themeModeKey, mode.name);
  }
}
