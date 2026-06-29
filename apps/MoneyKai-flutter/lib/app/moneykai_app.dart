import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/application/auth_controller.dart';
import '../features/settings/application/theme_mode_controller.dart';
import '../routing/app_routes.dart';
import '../routing/app_router.dart';
import '../theme/app_theme.dart';

class MoneyKaiApp extends ConsumerStatefulWidget {
  const MoneyKaiApp({this.initialLocation = AppRoutes.splash, super.key});

  final String initialLocation;

  @override
  ConsumerState<MoneyKaiApp> createState() => _MoneyKaiAppState();
}

class _MoneyKaiAppState extends ConsumerState<MoneyKaiApp> {
  late final _routerRefresh = _RouterRefreshNotifier();
  late final ProviderSubscription _authSubscription;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _authSubscription = ref.listenManual(
      authControllerProvider,
      (_, _) => _routerRefresh.refresh(),
    );
    _router = createAppRouter(
      initialLocation: widget.initialLocation,
      readAuthState: () => ref.read(authControllerProvider),
      refreshListenable: _routerRefresh,
    );
  }

  @override
  void dispose() {
    _authSubscription.close();
    _router.dispose();
    _routerRefresh.dispose();
    super.dispose();
  }

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

class _RouterRefreshNotifier extends ChangeNotifier {
  void refresh() => notifyListeners();
}
