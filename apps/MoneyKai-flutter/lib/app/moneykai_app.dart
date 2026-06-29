import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/settings/application/theme_mode_controller.dart';
import '../routing/app_router.dart';
import '../theme/app_theme.dart';

class MoneyKaiApp extends ConsumerStatefulWidget {
  const MoneyKaiApp({super.key});

  @override
  ConsumerState<MoneyKaiApp> createState() => _MoneyKaiAppState();
}

class _MoneyKaiAppState extends ConsumerState<MoneyKaiApp> {
  late final _router = createAppRouter();

  @override
  Widget build(BuildContext context) {
    final themeMode =
        ref.watch(themeModeControllerProvider).value ?? ThemeMode.system;

    return MaterialApp.router(
      title: 'MoneyKai',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      routerConfig: _router,
    );
  }
}
