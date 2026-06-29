import 'package:flutter/material.dart';

class AppTheme {
  const AppTheme._();

  static const _primary = Color(0xFF0F766E);
  static const _primaryDark = Color(0xFF7DD3C7);
  static const _lightBackground = Color(0xFFF6F8F5);
  static const _darkBackground = Color(0xFF07110F);

  static ThemeData light() {
    return _theme(
      brightness: Brightness.light,
      seedColor: _primary,
      scaffoldBackground: _lightBackground,
    );
  }

  static ThemeData dark() {
    return _theme(
      brightness: Brightness.dark,
      seedColor: _primaryDark,
      scaffoldBackground: _darkBackground,
    );
  }

  static ThemeData _theme({
    required Brightness brightness,
    required Color seedColor,
    required Color scaffoldBackground,
  }) {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: seedColor,
      brightness: brightness,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: scaffoldBackground,
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        backgroundColor: scaffoldBackground,
        foregroundColor: colorScheme.onSurface,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: colorScheme.surface,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: colorScheme.outlineVariant),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        filled: true,
      ),
    );
  }
}
