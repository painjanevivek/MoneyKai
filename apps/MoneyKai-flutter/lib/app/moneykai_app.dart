import 'package:flutter/material.dart';

import '../routing/app_router.dart';
import '../theme/app_theme.dart';

class MoneyKaiApp extends StatefulWidget {
  const MoneyKaiApp({super.key});

  @override
  State<MoneyKaiApp> createState() => _MoneyKaiAppState();
}

class _MoneyKaiAppState extends State<MoneyKaiApp> {
  late final _router = createAppRouter();

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'MoneyKai',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      routerConfig: _router,
    );
  }
}
