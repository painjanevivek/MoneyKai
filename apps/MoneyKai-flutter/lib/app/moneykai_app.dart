import 'package:flutter/material.dart';

import '../routing/app_router.dart';
import '../theme/app_theme.dart';

class MoneyKaiApp extends StatelessWidget {
  const MoneyKaiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'MoneyKai',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      routerConfig: appRouter,
    );
  }
}
