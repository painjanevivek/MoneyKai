import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_storage_provider.dart';
import '../data/theme_preference_repository.dart';

final themePreferenceRepositoryProvider =
    FutureProvider<ThemePreferenceRepository>((ref) async {
      final storage = await ref.watch(localStorageServiceProvider.future);
      return ThemePreferenceRepository(storage);
    });

final themeModeControllerProvider =
    AsyncNotifierProvider<ThemeModeController, ThemeMode>(
      ThemeModeController.new,
    );

class ThemeModeController extends AsyncNotifier<ThemeMode> {
  @override
  Future<ThemeMode> build() async {
    final repository = await ref.watch(
      themePreferenceRepositoryProvider.future,
    );
    return repository.readThemeMode();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = await AsyncValue.guard(() async {
      final repository = await ref.read(
        themePreferenceRepositoryProvider.future,
      );
      await repository.saveThemeMode(mode);
      return mode;
    });
  }
}
